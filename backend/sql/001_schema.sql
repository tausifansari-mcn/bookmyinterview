-- ============================================================
-- BOOK MY INTERVIEW — Complete Database Schema
-- Database: suggest | Server: 122.184.128.90
-- Run: mysql -h 122.184.128.90 -u <user> -p suggest < 001_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS suggest
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE suggest;

-- ────────────────────────────────────────────────────────────
-- TENANTS (Multi-tenant SaaS foundation)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_tenant (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_code     VARCHAR(50)  NOT NULL UNIQUE,
  company_name    VARCHAR(255) NOT NULL,
  company_logo    VARCHAR(500),
  industry        VARCHAR(100),
  company_size    ENUM('1-10','11-50','51-200','201-500','501-1000','1000+') DEFAULT '51-200',
  country         VARCHAR(100) NOT NULL DEFAULT 'India',
  timezone        VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
  plan            ENUM('starter','growth','enterprise','white_label') NOT NULL DEFAULT 'starter',
  plan_expires_at DATETIME,
  ai_credits      INT          NOT NULL DEFAULT 100,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_code (tenant_code),
  INDEX idx_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- USERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_user (
  id                   CHAR(36)     NOT NULL PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  email                VARCHAR(255) NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  full_name            VARCHAR(255) NOT NULL,
  mobile               VARCHAR(20),
  avatar_url           VARCHAR(500),
  role                 ENUM('super_admin','admin','hr_manager','recruiter','interviewer','hiring_manager','viewer') NOT NULL DEFAULT 'recruiter',
  is_blocked           TINYINT(1)   NOT NULL DEFAULT 0,
  must_change_password TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at        DATETIME,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_email (tenant_id, email),
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_refresh_token (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL,
  tenant_id   CHAR(36)     NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  revoked     TINYINT(1)   NOT NULL DEFAULT 0,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES bmi_user(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, revoked),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- ORG MASTERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_department (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id    CHAR(36)     NOT NULL,
  name         VARCHAR(255) NOT NULL,
  code         VARCHAR(50),
  head_user_id CHAR(36),
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_dept (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_location (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id  CHAR(36)     NOT NULL,
  city       VARCHAR(100) NOT NULL,
  state      VARCHAR(100),
  country    VARCHAR(100) NOT NULL DEFAULT 'India',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- PIPELINE TEMPLATES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_pipeline_template (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id   CHAR(36)     NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_default  TINYINT(1)   NOT NULL DEFAULT 0,
  created_by  CHAR(36)     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_pipeline_stage (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  pipeline_template_id CHAR(36)     NOT NULL,
  tenant_id            CHAR(36)     NOT NULL,
  stage_name           VARCHAR(100) NOT NULL,
  stage_order          INT          NOT NULL,
  stage_type           ENUM('screening','assessment','interview','offer','background_check','onboarding','rejected','withdrawn') NOT NULL,
  auto_advance         TINYINT(1)   NOT NULL DEFAULT 0,
  sla_hours            INT,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pipeline_template_id) REFERENCES bmi_pipeline_template(id) ON DELETE CASCADE,
  UNIQUE KEY uq_template_order (pipeline_template_id, stage_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- JOBS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_job (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  job_code             VARCHAR(50)  NOT NULL,
  title                VARCHAR(255) NOT NULL,
  department_id        CHAR(36),
  location_id          CHAR(36),
  job_type             ENUM('full_time','part_time','contract','internship','temp') NOT NULL DEFAULT 'full_time',
  work_mode            ENUM('onsite','remote','hybrid') NOT NULL DEFAULT 'onsite',
  experience_min_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  experience_max_years DECIMAL(4,1),
  salary_min           DECIMAL(12,2),
  salary_max           DECIMAL(12,2),
  salary_currency      VARCHAR(3)   NOT NULL DEFAULT 'INR',
  headcount            INT          NOT NULL DEFAULT 1,
  filled_count         INT          NOT NULL DEFAULT 0,
  description          TEXT,
  requirements         TEXT,
  ai_jd                TEXT,
  pipeline_template_id CHAR(36),
  status               ENUM('draft','open','paused','closed','cancelled') NOT NULL DEFAULT 'draft',
  priority             ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  posted_at            DATETIME,
  closes_at            DATETIME,
  created_by           CHAR(36)     NOT NULL,
  hiring_manager_id    CHAR(36),
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES bmi_department(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES bmi_location(id) ON DELETE SET NULL,
  UNIQUE KEY uq_tenant_job_code (tenant_id, job_code),
  INDEX idx_status (status),
  INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- CANDIDATES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_candidate (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id           CHAR(36)     NOT NULL,
  candidate_code      VARCHAR(50)  NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255),
  mobile              VARCHAR(20)  NOT NULL,
  mobile_hash         VARCHAR(64),
  email_hash          VARCHAR(64),
  gender              ENUM('male','female','other','prefer_not_to_say'),
  date_of_birth       DATE,
  current_location    VARCHAR(255),
  preferred_location  VARCHAR(255),
  current_company     VARCHAR(255),
  current_designation VARCHAR(255),
  experience_years    DECIMAL(4,1),
  notice_period_days  INT,
  current_salary      DECIMAL(12,2),
  expected_salary     DECIMAL(12,2),
  resume_url          VARCHAR(500),
  resume_text         LONGTEXT,
  skills_summary      TEXT,
  source              ENUM('job_board','referral','linkedin','walk_in','agency','campus','direct','other') NOT NULL DEFAULT 'direct',
  source_detail       VARCHAR(255),
  referred_by_user_id CHAR(36),
  ai_score            DECIMAL(5,2),
  ai_summary          TEXT,
  tags                JSON,
  is_blacklisted      TINYINT(1)   NOT NULL DEFAULT 0,
  blacklist_reason    TEXT,
  created_by          CHAR(36),
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_code (tenant_id, candidate_code),
  INDEX idx_mobile_hash (mobile_hash),
  INDEX idx_email_hash (email_hash),
  INDEX idx_tenant (tenant_id),
  INDEX idx_ai_score (ai_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- APPLICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_application (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  job_id               CHAR(36)     NOT NULL,
  candidate_id         CHAR(36)     NOT NULL,
  current_stage_id     CHAR(36),
  current_stage_name   VARCHAR(100) NOT NULL DEFAULT 'Applied',
  status               ENUM('active','selected','rejected','withdrawn','on_hold','offer_extended','offer_accepted','offer_declined','joined','no_show') NOT NULL DEFAULT 'active',
  ai_match_score       DECIMAL(5,2),
  ai_match_reason      TEXT,
  recruiter_id         CHAR(36),
  applied_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_action_at       DATETIME,
  next_action_at       DATETIME,
  rejection_reason     VARCHAR(255),
  withdrawal_reason    VARCHAR(255),
  notes                TEXT,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES bmi_job(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  UNIQUE KEY uq_job_candidate (job_id, candidate_id),
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_recruiter (recruiter_id),
  INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_application_stage_log (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id           CHAR(36)     NOT NULL,
  application_id      CHAR(36)     NOT NULL,
  from_stage          VARCHAR(100),
  to_stage            VARCHAR(100) NOT NULL,
  from_status         VARCHAR(100),
  to_status           VARCHAR(100) NOT NULL,
  moved_by            CHAR(36),
  reason              TEXT,
  time_in_stage_hours INT,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- INTERVIEWS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_interview (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id      CHAR(36)     NOT NULL,
  application_id CHAR(36)     NOT NULL,
  interview_type ENUM('phone','video','in_person','panel','technical','hr','final','ai_screening') NOT NULL,
  round_number   INT          NOT NULL DEFAULT 1,
  scheduled_at   DATETIME     NOT NULL,
  duration_mins  INT          NOT NULL DEFAULT 60,
  location       VARCHAR(255),
  meeting_link   VARCHAR(500),
  status         ENUM('scheduled','confirmed','in_progress','completed','cancelled','rescheduled','no_show') NOT NULL DEFAULT 'scheduled',
  interview_notes TEXT,
  ai_questions   JSON,
  created_by     CHAR(36)     NOT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_application (application_id),
  INDEX idx_scheduled (tenant_id, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_interview_feedback (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id      CHAR(36)     NOT NULL,
  interview_id   CHAR(36)     NOT NULL,
  interviewer_id CHAR(36)     NOT NULL,
  overall_rating TINYINT      NOT NULL,
  recommendation ENUM('strong_yes','yes','maybe','no','strong_no') NOT NULL,
  skills_scores  JSON,
  strengths      TEXT,
  concerns       TEXT,
  notes          TEXT,
  submitted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (interview_id) REFERENCES bmi_interview(id) ON DELETE CASCADE,
  UNIQUE KEY uq_interview_interviewer (interview_id, interviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- OFFERS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_offer (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id             CHAR(36)     NOT NULL,
  application_id        CHAR(36)     NOT NULL,
  offer_number          VARCHAR(50)  NOT NULL,
  designation           VARCHAR(255) NOT NULL,
  department_id         CHAR(36),
  location_id           CHAR(36),
  joining_date          DATE,
  offer_expiry_date     DATE,
  ctc_annual            DECIMAL(12,2) NOT NULL,
  salary_components     JSON,
  offer_letter_url      VARCHAR(500),
  status                ENUM('draft','pending_approval','approved','sent','accepted','declined','revoked','expired') NOT NULL DEFAULT 'draft',
  approved_by           CHAR(36),
  approved_at           DATETIME,
  sent_at               DATETIME,
  candidate_response_at DATETIME,
  decline_reason        TEXT,
  created_by            CHAR(36)     NOT NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_offer (tenant_id, offer_number),
  INDEX idx_application (application_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- ASSESSMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_assessment (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id       CHAR(36)     NOT NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  type            ENUM('mcq','coding','psychometric','video','case_study','assignment') NOT NULL,
  duration_mins   INT          NOT NULL DEFAULT 30,
  total_marks     INT          NOT NULL DEFAULT 100,
  passing_marks   INT          NOT NULL DEFAULT 40,
  questions       JSON,
  is_ai_generated TINYINT(1)   NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_by      CHAR(36)     NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_type (tenant_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_assessment_attempt (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id       CHAR(36)     NOT NULL,
  application_id  CHAR(36)     NOT NULL,
  assessment_id   CHAR(36)     NOT NULL,
  candidate_token VARCHAR(255) NOT NULL UNIQUE,
  status          ENUM('pending','in_progress','completed','expired','cancelled') NOT NULL DEFAULT 'pending',
  score           DECIMAL(6,2),
  percentage      DECIMAL(5,2),
  passed          TINYINT(1),
  answers         JSON,
  ai_scoring      JSON,
  started_at      DATETIME,
  completed_at    DATETIME,
  expires_at      DATETIME     NOT NULL,
  ip_address      VARCHAR(45),
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES bmi_assessment(id) ON DELETE CASCADE,
  INDEX idx_application (application_id),
  INDEX idx_token (candidate_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- BACKGROUND VERIFICATION
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_bgv_request (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  application_id   CHAR(36)     NOT NULL,
  provider         ENUM('digio','infinity_ai','authbridge','hiregenie','manual') NOT NULL,
  provider_ref_id  VARCHAR(255),
  checks_requested JSON,
  status           ENUM('initiated','in_progress','completed','failed','cancelled') NOT NULL DEFAULT 'initiated',
  result           ENUM('clear','adverse','pending','inconclusive') DEFAULT 'pending',
  report_url       VARCHAR(500),
  completed_at     DATETIME,
  notes            TEXT,
  initiated_by     CHAR(36)     NOT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- AI ENGINE
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_ai_screening_result (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id       CHAR(36)     NOT NULL,
  application_id  CHAR(36)     NOT NULL UNIQUE,
  job_id          CHAR(36)     NOT NULL,
  model_used      VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-6',
  match_score     DECIMAL(5,2) NOT NULL,
  skill_match     JSON,
  experience_match TINYINT(1)  NOT NULL DEFAULT 0,
  salary_match    TINYINT(1)   NOT NULL DEFAULT 0,
  red_flags       JSON,
  recommendation  ENUM('shortlist','maybe','reject') NOT NULL,
  summary         TEXT         NOT NULL,
  tokens_used     INT          NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_score (match_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_ai_credit_ledger (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id     CHAR(36)     NOT NULL,
  action        ENUM('topup','resume_screen','jd_generate','interview_questions','report_generate','assessment_generate') NOT NULL,
  credits_delta INT          NOT NULL,
  balance_after INT          NOT NULL,
  reference_id  CHAR(36),
  notes         VARCHAR(255),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_date (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_notification_log (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  channel          ENUM('email','sms','whatsapp','in_app') NOT NULL,
  recipient_type   ENUM('candidate','user') NOT NULL,
  recipient_id     CHAR(36)     NOT NULL,
  recipient_email  VARCHAR(255),
  recipient_mobile VARCHAR(20),
  subject          VARCHAR(500),
  body             TEXT,
  status           ENUM('queued','sent','failed','delivered','bounced') NOT NULL DEFAULT 'queued',
  provider_ref     VARCHAR(255),
  error_message    TEXT,
  sent_at          DATETIME,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- BILLING & SUBSCRIPTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_subscription (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL UNIQUE,
  plan                 ENUM('starter','growth','enterprise','white_label') NOT NULL,
  billing_cycle        ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  status               ENUM('active','past_due','cancelled','trialing','paused') NOT NULL DEFAULT 'trialing',
  razorpay_sub_id      VARCHAR(255),
  amount               DECIMAL(10,2) NOT NULL,
  currency             VARCHAR(3)   NOT NULL DEFAULT 'INR',
  trial_ends_at        DATETIME,
  current_period_start DATETIME,
  current_period_end   DATETIME,
  cancelled_at         DATETIME,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- AUDIT LOG (SOC2 requirement — immutable)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_audit_log (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id   CHAR(36)     NOT NULL,
  actor_id    CHAR(36),
  actor_email VARCHAR(255),
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   CHAR(36),
  old_values  JSON,
  new_values  JSON,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_entity (tenant_id, entity_type, entity_id),
  INDEX idx_tenant_date (tenant_id, created_at),
  INDEX idx_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- ANALYTICS (pre-aggregated)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_hiring_metric_daily (
  id                    CHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id             CHAR(36)  NOT NULL,
  job_id                CHAR(36),
  metric_date           DATE      NOT NULL,
  applications_received INT       NOT NULL DEFAULT 0,
  applications_screened INT       NOT NULL DEFAULT 0,
  shortlisted           INT       NOT NULL DEFAULT 0,
  interviews_scheduled  INT       NOT NULL DEFAULT 0,
  interviews_completed  INT       NOT NULL DEFAULT 0,
  offers_sent           INT       NOT NULL DEFAULT 0,
  offers_accepted       INT       NOT NULL DEFAULT 0,
  joined                INT       NOT NULL DEFAULT 0,
  rejected              INT       NOT NULL DEFAULT 0,
  avg_time_to_hire_days DECIMAL(6,2),
  ai_credits_consumed   INT       NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_job_date (tenant_id, job_id, metric_date),
  INDEX idx_tenant_date (tenant_id, metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- CANDIDATE PORTAL
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_candidate_portal_session (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  candidate_id       CHAR(36)     NOT NULL,
  tenant_id          CHAR(36)     NOT NULL,
  otp_hash           VARCHAR(255),
  otp_expires_at     DATETIME,
  session_token      VARCHAR(255) UNIQUE,
  session_expires_at DATETIME,
  ip_address         VARCHAR(45),
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_document (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id     CHAR(36)     NOT NULL,
  candidate_id  CHAR(36)     NOT NULL,
  document_type ENUM('resume','aadhaar','pan','mark_sheet','experience_letter','offer_letter','photo','other') NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  file_size_kb  INT,
  uploaded_by   ENUM('candidate','recruiter','system') NOT NULL DEFAULT 'candidate',
  verified      TINYINT(1)   NOT NULL DEFAULT 0,
  verified_by   CHAR(36),
  verified_at   DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate_type (candidate_id, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- JOB BOARD INTEGRATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bmi_job_board_post (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  job_id           CHAR(36)     NOT NULL,
  board            ENUM('naukri','linkedin','indeed','shine','monster','glassdoor','internal','careers_page') NOT NULL,
  external_post_id VARCHAR(255),
  post_url         VARCHAR(500),
  status           ENUM('pending','active','paused','closed','failed') NOT NULL DEFAULT 'pending',
  posted_at        DATETIME,
  expires_at       DATETIME,
  applications_count INT        NOT NULL DEFAULT 0,
  error_message    TEXT,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES bmi_job(id) ON DELETE CASCADE,
  INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- SEED: Demo tenant + admin user
-- ────────────────────────────────────────────────────────────
SET @tenant_id = UUID();
SET @admin_id  = UUID();

INSERT INTO bmi_tenant (id, tenant_code, company_name, industry, company_size, plan, ai_credits)
VALUES (@tenant_id, 'BMI-DEMO', 'Book My Interview Demo', 'Technology', '51-200', 'enterprise', 10000);

-- Password: Admin@123 (bcrypt hash)
INSERT INTO bmi_user (id, tenant_id, email, password_hash, full_name, role)
VALUES (@admin_id, @tenant_id, 'admin@bookmyinterview.in',
        '$2b$10$rOyDgaJkF4HBuKpKFLjJBOVQ6Uz2J5GMnWfOqG6TH8NOAVvYWCLim',
        'System Admin', 'super_admin');

INSERT INTO bmi_department (id, tenant_id, name, code)
VALUES (UUID(), @tenant_id, 'Operations', 'OPS'),
       (UUID(), @tenant_id, 'Quality', 'QA'),
       (UUID(), @tenant_id, 'Training', 'TRN'),
       (UUID(), @tenant_id, 'Human Resources', 'HR');

INSERT INTO bmi_location (id, tenant_id, city, state, country)
VALUES (UUID(), @tenant_id, 'Mumbai', 'Maharashtra', 'India'),
       (UUID(), @tenant_id, 'Pune', 'Maharashtra', 'India'),
       (UUID(), @tenant_id, 'Delhi', 'Delhi', 'India'),
       (UUID(), @tenant_id, 'Bangalore', 'Karnataka', 'India'),
       (UUID(), @tenant_id, 'Hyderabad', 'Telangana', 'India');

SELECT 'Book My Interview schema created successfully on suggest database.' AS status;
SELECT COUNT(*) AS bmi_tables_created FROM information_schema.tables
WHERE table_schema = 'suggest' AND table_name LIKE 'bmi_%';
