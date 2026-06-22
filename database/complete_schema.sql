-- ============================================================
-- BOOK MY INTERVIEW (BMI) — Complete Database Setup
-- Version: 2026-06 (includes all migrations)
-- Database: getjob | Engine: MySQL 8.0+
--
-- HOW TO RUN:
--   mysql -h <HOST> -P <PORT> -u <USER> -p < complete_schema.sql
--
-- DEFAULT CREDENTIALS AFTER SETUP:
--   Super Admin Portal  → superadmin@bookmyinterview.in / Admin@123
--   Client Admin        → admin@bookmyinterview.in      / Admin@123
--   Candidate Portal    → Register via /portal/register
-- ============================================================

CREATE DATABASE IF NOT EXISTS getjob
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE getjob;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. TENANTS (multi-tenant SaaS — one row per client company)
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_tenant (
  id                          CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_code                 VARCHAR(50)  NOT NULL UNIQUE,
  company_name                VARCHAR(255) NOT NULL,
  company_logo                VARCHAR(500)          DEFAULT NULL,
  logo_url                    VARCHAR(500)          DEFAULT NULL,
  company_tagline             VARCHAR(255)          DEFAULT NULL,
  website                     VARCHAR(500)          DEFAULT NULL,
  industry                    VARCHAR(100)          DEFAULT NULL,
  company_size                ENUM('1-10','11-50','51-200','201-500','501-1000','1000+') DEFAULT '51-200',
  country                     VARCHAR(100) NOT NULL DEFAULT 'India',
  timezone                    VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
  cin_number                  VARCHAR(50)           DEFAULT NULL,
  gst_number                  VARCHAR(20)           DEFAULT NULL,
  address_line1               VARCHAR(500)          DEFAULT NULL,
  city                        VARCHAR(100)          DEFAULT NULL,
  state                       VARCHAR(100)          DEFAULT NULL,
  pincode                     VARCHAR(10)           DEFAULT NULL,
  location_city               VARCHAR(100)          DEFAULT NULL,
  about_company               TEXT                  DEFAULT NULL,
  culture_description         TEXT                  DEFAULT NULL,
  achievements_json           JSON                  DEFAULT NULL,
  primary_contact_name        VARCHAR(200)          DEFAULT NULL,
  primary_contact_phone       VARCHAR(20)           DEFAULT NULL,
  primary_contact_designation VARCHAR(200)          DEFAULT NULL,
  plan                        ENUM('starter','growth','enterprise','white_label') NOT NULL DEFAULT 'starter',
  plan_expires_at             DATETIME              DEFAULT NULL,
  subscription_status         ENUM('trial','active','suspended','expired') DEFAULT 'trial',
  trial_ends_at               DATETIME              DEFAULT NULL,
  ai_credits                  INT          NOT NULL DEFAULT 100,
  max_jobs                    INT                   DEFAULT 10,
  max_candidates              INT                   DEFAULT 500,
  permissions                 JSON                  DEFAULT NULL COMMENT 'Feature flags per client',
  onboarding_completed        TINYINT(1)            DEFAULT 0,
  onboarding_completed_at     DATETIME              DEFAULT NULL,
  is_active                   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant_code (tenant_code),
  INDEX idx_plan (plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. PLATFORM ADMINS (super admin — not per-tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_platform_admin (
  id            CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200)          DEFAULT NULL,
  is_active     TINYINT(1)            DEFAULT 1,
  last_login_at DATETIME              DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CLIENT USERS (per-tenant HR / recruiter users)
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_user (
  id                   CHAR(36)     NOT NULL PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  email                VARCHAR(255) NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  full_name            VARCHAR(255) NOT NULL,
  mobile               VARCHAR(20)           DEFAULT NULL,
  avatar_url           VARCHAR(500)          DEFAULT NULL,
  role                 ENUM('super_admin','admin','hr_manager','recruiter','interviewer','hiring_manager','viewer') NOT NULL DEFAULT 'recruiter',
  is_blocked           TINYINT(1)   NOT NULL DEFAULT 0,
  must_change_password TINYINT(1)   NOT NULL DEFAULT 0,
  last_login_at        DATETIME              DEFAULT NULL,
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
  ip_address  VARCHAR(45)           DEFAULT NULL,
  user_agent  TEXT                  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES bmi_user(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, revoked),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_admin_otp (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  user_id    CHAR(36)     NOT NULL,
  tenant_id  CHAR(36)     NOT NULL,
  otp_hash   VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. CANDIDATES (portal self-registration + recruiter-added)
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_candidate (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id           CHAR(36)     NOT NULL,
  candidate_code      VARCHAR(50)  NOT NULL,
  full_name           VARCHAR(255) NOT NULL,
  email               VARCHAR(255)          DEFAULT NULL,
  mobile              VARCHAR(20)  NOT NULL,
  alternate_mobile    VARCHAR(20)           DEFAULT NULL,
  alternate_email     VARCHAR(255)          DEFAULT NULL,
  password_hash       VARCHAR(255)          DEFAULT NULL COMMENT 'Candidate portal login password',
  mobile_hash         VARCHAR(64)           DEFAULT NULL,
  email_hash          VARCHAR(64)           DEFAULT NULL,
  gender              ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
  date_of_birth       DATE                  DEFAULT NULL,
  current_location    VARCHAR(255)          DEFAULT NULL,
  preferred_location  VARCHAR(255)          DEFAULT NULL,
  work_preference     VARCHAR(50)           DEFAULT NULL COMMENT 'remote/onsite/hybrid/flexible',
  current_company     VARCHAR(255)          DEFAULT NULL,
  current_designation VARCHAR(255)          DEFAULT NULL,
  experience_years    DECIMAL(4,1)          DEFAULT NULL,
  notice_period_days  INT                   DEFAULT NULL,
  current_salary      DECIMAL(12,2)         DEFAULT NULL,
  expected_salary     DECIMAL(12,2)         DEFAULT NULL,
  current_ctc         DECIMAL(12,2)         DEFAULT NULL,
  expected_ctc        DECIMAL(12,2)         DEFAULT NULL,
  resume_url          VARCHAR(500)          DEFAULT NULL,
  resume_text         LONGTEXT              DEFAULT NULL,
  profile_photo_url   VARCHAR(500)          DEFAULT NULL,
  voice_intro_url     VARCHAR(500)          DEFAULT NULL,
  voice_intro_duration INT                  DEFAULT NULL COMMENT 'Duration in seconds',
  skills_summary      TEXT                  DEFAULT NULL,
  professional_summary TEXT                 DEFAULT NULL,
  about_me            TEXT                  DEFAULT NULL,
  career_objective    TEXT                  DEFAULT NULL,
  linkedin_url        VARCHAR(500)          DEFAULT NULL,
  github_url          VARCHAR(500)          DEFAULT NULL,
  portfolio_url       VARCHAR(500)          DEFAULT NULL,
  source              ENUM('job_board','referral','linkedin','walk_in','agency','campus','direct','portal','other') NOT NULL DEFAULT 'direct',
  source_detail       VARCHAR(255)          DEFAULT NULL,
  referred_by_user_id CHAR(36)              DEFAULT NULL,
  ai_score            DECIMAL(5,2)          DEFAULT NULL,
  ai_summary          TEXT                  DEFAULT NULL,
  profile_completion  INT                   DEFAULT 0,
  tags                JSON                  DEFAULT NULL,
  is_blacklisted      TINYINT(1)   NOT NULL DEFAULT 0,
  blacklist_reason    TEXT                  DEFAULT NULL,
  created_by          CHAR(36)              DEFAULT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_code (tenant_id, candidate_code),
  INDEX idx_mobile_hash (mobile_hash),
  INDEX idx_email_hash (email_hash),
  INDEX idx_tenant (tenant_id),
  INDEX idx_ai_score (ai_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate profile sub-tables
CREATE TABLE IF NOT EXISTS bmi_candidate_education (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id      CHAR(36)     NOT NULL,
  candidate_id   CHAR(36)     NOT NULL,
  qualification  VARCHAR(200) NOT NULL COMMENT 'e.g. Bachelor, Master, PhD, HSC, SSC',
  degree         VARCHAR(200) NOT NULL COMMENT 'e.g. B.Tech, MBA, B.Com',
  specialization VARCHAR(200)          DEFAULT NULL,
  institute      VARCHAR(300) NOT NULL,
  university     VARCHAR(300)          DEFAULT NULL,
  passing_year   YEAR                  DEFAULT NULL,
  percentage     DECIMAL(5,2)          DEFAULT NULL,
  cgpa           DECIMAL(4,2)          DEFAULT NULL,
  sort_order     INT                   DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_experience (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id             CHAR(36)     NOT NULL,
  candidate_id          CHAR(36)     NOT NULL,
  company_name          VARCHAR(300) NOT NULL,
  designation           VARCHAR(200) NOT NULL,
  joining_date          DATE         NOT NULL,
  relieving_date        DATE                  DEFAULT NULL,
  is_current            TINYINT(1)            DEFAULT 0,
  roles_responsibilities TEXT                 DEFAULT NULL,
  sort_order            INT                   DEFAULT 0,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_skill (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id      CHAR(36)     NOT NULL,
  candidate_id   CHAR(36)     NOT NULL,
  skill_name     VARCHAR(200) NOT NULL,
  experience_years DECIMAL(4,1)        DEFAULT NULL,
  skill_level    ENUM('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
  sort_order     INT                   DEFAULT 0,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_certification (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  candidate_id         CHAR(36)     NOT NULL,
  certification_name   VARCHAR(300) NOT NULL,
  issuing_organization VARCHAR(300) NOT NULL,
  issue_date           DATE                  DEFAULT NULL,
  expiry_date          DATE                  DEFAULT NULL,
  certificate_url      VARCHAR(500)          DEFAULT NULL,
  sort_order           INT                   DEFAULT 0,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_language (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id    CHAR(36)     NOT NULL,
  candidate_id CHAR(36)     NOT NULL,
  language     VARCHAR(100) NOT NULL,
  can_read     TINYINT(1)            DEFAULT 0,
  can_write    TINYINT(1)            DEFAULT 0,
  can_speak    TINYINT(1)            DEFAULT 1,
  proficiency  ENUM('basic','conversational','proficient','fluent','native') DEFAULT 'conversational',
  sort_order   INT                   DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_portal_session (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  candidate_id       CHAR(36)     NOT NULL,
  tenant_id          CHAR(36)     NOT NULL,
  otp_hash           VARCHAR(255)          DEFAULT NULL,
  otp_expires_at     DATETIME              DEFAULT NULL,
  session_token      VARCHAR(255)          DEFAULT NULL UNIQUE,
  session_expires_at DATETIME              DEFAULT NULL,
  ip_address         VARCHAR(45)           DEFAULT NULL,
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
  file_size_kb  INT                   DEFAULT NULL,
  uploaded_by   ENUM('candidate','recruiter','system') NOT NULL DEFAULT 'candidate',
  verified      TINYINT(1)   NOT NULL DEFAULT 0,
  verified_by   CHAR(36)              DEFAULT NULL,
  verified_at   DATETIME              DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate_type (candidate_id, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_saved_job (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  candidate_id CHAR(36)     NOT NULL,
  job_id       CHAR(36)     NOT NULL,
  saved_at     DATETIME              DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_job (candidate_id, job_id),
  INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_candidate_feedback (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  candidate_id    CHAR(36)     NOT NULL,
  candidate_name  VARCHAR(200)          DEFAULT NULL,
  candidate_email VARCHAR(300)          DEFAULT NULL,
  feedback_type   ENUM('bug','suggestion','complaint','praise','other') NOT NULL DEFAULT 'other',
  rating          TINYINT               DEFAULT NULL COMMENT '1-5 stars',
  message         TEXT         NOT NULL,
  sentiment       ENUM('positive','neutral','negative')                 DEFAULT NULL,
  page_context    VARCHAR(100)          DEFAULT NULL,
  created_at      DATETIME              DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_candidate (candidate_id),
  INDEX idx_sentiment (sentiment),
  INDEX idx_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ORG MASTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_department (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id    CHAR(36)     NOT NULL,
  name         VARCHAR(255) NOT NULL,
  code         VARCHAR(50)           DEFAULT NULL,
  head_user_id CHAR(36)              DEFAULT NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_dept (tenant_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_location (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id  CHAR(36)     NOT NULL,
  city       VARCHAR(100) NOT NULL,
  state      VARCHAR(100)          DEFAULT NULL,
  country    VARCHAR(100) NOT NULL DEFAULT 'India',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_job (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  job_code             VARCHAR(50)  NOT NULL,
  title                VARCHAR(255) NOT NULL,
  department_id        CHAR(36)              DEFAULT NULL,
  location_id          CHAR(36)              DEFAULT NULL,
  job_type             ENUM('full_time','part_time','contract','internship','temp','temporary') NOT NULL DEFAULT 'full_time',
  work_mode            ENUM('onsite','remote','hybrid') NOT NULL DEFAULT 'onsite',
  experience_min_years DECIMAL(4,1) NOT NULL DEFAULT 0,
  experience_max_years DECIMAL(4,1)          DEFAULT NULL,
  salary_min           DECIMAL(12,2)         DEFAULT NULL,
  salary_max           DECIMAL(12,2)         DEFAULT NULL,
  salary_currency      VARCHAR(3)   NOT NULL DEFAULT 'INR',
  headcount            INT          NOT NULL DEFAULT 1,
  filled_count         INT          NOT NULL DEFAULT 0,
  description          TEXT                  DEFAULT NULL,
  requirements         TEXT                  DEFAULT NULL,
  ai_jd                TEXT                  DEFAULT NULL,
  skills_required      JSON                  DEFAULT NULL COMMENT '["React","Node.js","SQL"]',
  pipeline_template_id CHAR(36)              DEFAULT NULL,
  status               ENUM('draft','open','paused','closed','cancelled') NOT NULL DEFAULT 'draft',
  priority             ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  posted_at            DATETIME              DEFAULT NULL,
  closes_at            DATETIME              DEFAULT NULL,
  created_by           CHAR(36)     NOT NULL,
  hiring_manager_id    CHAR(36)              DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES bmi_department(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES bmi_location(id) ON DELETE SET NULL,
  UNIQUE KEY uq_tenant_job_code (tenant_id, job_code),
  INDEX idx_status (status),
  INDEX idx_tenant_status (tenant_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job-level application questions (custom per job)
CREATE TABLE IF NOT EXISTS bmi_job_question (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id     CHAR(36)     NOT NULL,
  job_id        CHAR(36)     NOT NULL,
  question      TEXT         NOT NULL,
  question_type ENUM('text','mcq','boolean','scale') NOT NULL DEFAULT 'text',
  options       JSON                  DEFAULT NULL COMMENT 'For MCQ: ["Option A","Option B"]',
  is_mandatory  TINYINT(1)            DEFAULT 1,
  sort_order    INT                   DEFAULT 0,
  created_by    CHAR(36)              DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES bmi_job(id) ON DELETE CASCADE,
  INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Per-tenant job question bank (for reuse)
CREATE TABLE IF NOT EXISTS bmi_job_question_bank (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  job_category     VARCHAR(200) NOT NULL,
  job_role         VARCHAR(200)          DEFAULT NULL,
  question         TEXT         NOT NULL,
  suggested_answer TEXT                  DEFAULT NULL,
  question_type    ENUM('text','mcq','boolean','scale') NOT NULL DEFAULT 'text',
  options          JSON                  DEFAULT NULL,
  difficulty_level ENUM('easy','medium','hard') DEFAULT 'medium',
  is_mandatory     TINYINT(1)            DEFAULT 0,
  is_active        TINYINT(1)            DEFAULT 1,
  created_by       CHAR(36)              DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_cat (tenant_id, job_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- JD requests from clients (pending super admin approval)
CREATE TABLE IF NOT EXISTS bmi_jd_request (
  id                   CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  tenant_id            CHAR(36)     NOT NULL,
  title                VARCHAR(300) NOT NULL,
  description          TEXT                  DEFAULT NULL,
  requirements         TEXT                  DEFAULT NULL,
  responsibilities     TEXT                  DEFAULT NULL,
  job_type             ENUM('full_time','part_time','contract','internship','temporary') DEFAULT 'full_time',
  work_mode            ENUM('onsite','remote','hybrid') DEFAULT 'onsite',
  experience_min_years DECIMAL(4,1)          DEFAULT 0,
  experience_max_years DECIMAL(4,1)          DEFAULT NULL,
  salary_min           DECIMAL(12,2)         DEFAULT NULL,
  salary_max           DECIMAL(12,2)         DEFAULT NULL,
  skills_required      JSON                  DEFAULT NULL,
  location             VARCHAR(200)          DEFAULT NULL,
  source_type          ENUM('upload','manual','existing') NOT NULL DEFAULT 'manual',
  uploaded_file_url    VARCHAR(500)          DEFAULT NULL,
  existing_job_id      CHAR(36)              DEFAULT NULL,
  status               ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_notes          TEXT                  DEFAULT NULL,
  reviewed_by          CHAR(36)              DEFAULT NULL,
  reviewed_at          DATETIME              DEFAULT NULL,
  created_by           CHAR(36)     NOT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tenant  (tenant_id),
  INDEX idx_status  (status),
  INDEX idx_created (created_at),
  CONSTRAINT fk_jdreq_tenant FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_application (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  job_id               CHAR(36)     NOT NULL,
  candidate_id         CHAR(36)     NOT NULL,
  current_stage_id     CHAR(36)              DEFAULT NULL,
  current_stage_name   VARCHAR(100) NOT NULL DEFAULT 'Application Received',
  status               ENUM('active','selected','rejected','withdrawn','on_hold','offer_extended','offer_accepted','offer_declined','joined','no_show') NOT NULL DEFAULT 'active',
  ai_match_score       DECIMAL(5,2)          DEFAULT NULL,
  ai_match_reason      TEXT                  DEFAULT NULL,
  recruiter_id         CHAR(36)              DEFAULT NULL,
  applied_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_action_at       DATETIME              DEFAULT NULL,
  next_action_at       DATETIME              DEFAULT NULL,
  rejection_reason     VARCHAR(255)          DEFAULT NULL,
  withdrawal_reason    VARCHAR(255)          DEFAULT NULL,
  notes                TEXT                  DEFAULT NULL COMMENT 'JSON with interview_date, meet_link, etc.',
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

CREATE TABLE IF NOT EXISTS bmi_application_answer (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id     CHAR(36)     NOT NULL,
  application_id CHAR(36)   NOT NULL,
  question_id   CHAR(36)     NOT NULL,
  question_text TEXT                  DEFAULT NULL,
  answer_text   TEXT                  DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_application (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evaluation / scoring engine results
CREATE TABLE IF NOT EXISTS bmi_evaluation_score (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  application_id   CHAR(36)     NOT NULL,
  candidate_id     CHAR(36)     NOT NULL,
  job_id           CHAR(36)     NOT NULL,
  profile_score    DECIMAL(5,2)          DEFAULT 0,
  education_score  DECIMAL(5,2)          DEFAULT 0,
  experience_score DECIMAL(5,2)          DEFAULT 0,
  skill_score      DECIMAL(5,2)          DEFAULT 0,
  resume_score     DECIMAL(5,2)          DEFAULT 0,
  assessment_score DECIMAL(5,2)          DEFAULT 0,
  total_score      DECIMAL(5,2)          DEFAULT 0,
  recommendation   ENUM('shortlist','maybe','reject')  DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (application_id),
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_total_score (total_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_assessment (
  id              CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id       CHAR(36)     NOT NULL,
  job_id          CHAR(36)              DEFAULT NULL COMMENT 'NULL = global, not job-specific',
  title           VARCHAR(255) NOT NULL,
  description     TEXT                  DEFAULT NULL,
  instructions    TEXT                  DEFAULT NULL,
  type            ENUM('mcq','coding','psychometric','video','case_study','assignment') NOT NULL DEFAULT 'mcq',
  duration_mins   INT          NOT NULL DEFAULT 30,
  time_limit_mins INT          NOT NULL DEFAULT 30,
  total_marks     INT          NOT NULL DEFAULT 100,
  passing_marks   INT          NOT NULL DEFAULT 40,
  passing_score   DECIMAL(5,2)          DEFAULT 50.00 COMMENT 'Percentage to pass',
  questions       JSON                  DEFAULT NULL COMMENT 'Array of question objects with correct_index',
  is_ai_generated TINYINT(1)   NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_by      CHAR(36)     NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES bmi_job(id) ON DELETE SET NULL,
  INDEX idx_tenant_type (tenant_id, type),
  INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Candidate assessment invitations and results
CREATE TABLE IF NOT EXISTS bmi_candidate_assessment (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL,
  assessment_id        CHAR(36)     NOT NULL,
  application_id       CHAR(36)              DEFAULT NULL,
  candidate_id         CHAR(36)     NOT NULL,
  status               ENUM('invited','started','completed','expired','cancelled') NOT NULL DEFAULT 'invited',
  invite_token         VARCHAR(128)          DEFAULT NULL UNIQUE COMMENT 'Token sent to candidate',
  total_marks          INT                   DEFAULT 0,
  scored_marks         DECIMAL(8,2)          DEFAULT NULL,
  percentage           DECIMAL(5,2)          DEFAULT NULL,
  passed               TINYINT(1)            DEFAULT NULL,
  time_taken_secs      INT                   DEFAULT NULL,
  attempt_count        INT                   DEFAULT 0,
  answers_submitted_json JSON                DEFAULT NULL COMMENT 'Per-question detail: is_correct, marks_scored, correct_options',
  started_at           DATETIME              DEFAULT NULL,
  completed_at         DATETIME              DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES bmi_assessment(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE SET NULL,
  FOREIGN KEY (candidate_id) REFERENCES bmi_candidate(id) ON DELETE CASCADE,
  INDEX idx_candidate (candidate_id),
  INDEX idx_application (application_id),
  INDEX idx_token (invite_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Platform-wide question bank (super admin manages, all tenants use)
CREATE TABLE IF NOT EXISTS bmi_platform_question_bank (
  id            CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  question_text TEXT         NOT NULL,
  question_type ENUM('single_choice','multi_choice','true_false') NOT NULL DEFAULT 'single_choice',
  options       JSON         NOT NULL COMMENT '["Option A", "Option B", "Option C", "Option D"]',
  correct_answer JSON        NOT NULL COMMENT '[2] = index 2 correct; [0,2] for multi_choice',
  skills        JSON         NOT NULL COMMENT '["JavaScript","React","Node.js"]',
  category      VARCHAR(100)          DEFAULT NULL COMMENT 'Frontend, Backend, DevOps, DSA, HR, Sales',
  difficulty    ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  marks         INT          NOT NULL DEFAULT 1,
  explanation   TEXT                  DEFAULT NULL,
  is_active     TINYINT(1)            DEFAULT 1,
  created_by    CHAR(36)              DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category   (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tracks which questions were auto-selected for each application
CREATE TABLE IF NOT EXISTS bmi_assessment_auto_log (
  id              CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  application_id  CHAR(36)     NOT NULL,
  job_id          CHAR(36)     NOT NULL,
  question_ids    JSON         NOT NULL,
  skills_matched  JSON                  DEFAULT NULL,
  total_questions INT          NOT NULL DEFAULT 0,
  total_marks     INT          NOT NULL DEFAULT 0,
  passing_score   DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_application (application_id),
  INDEX idx_job         (job_id),
  CONSTRAINT fk_auto_app FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  CONSTRAINT fk_auto_job FOREIGN KEY (job_id)         REFERENCES bmi_job(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. INTERVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_interview (
  id                     CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id              CHAR(36)     NOT NULL,
  application_id         CHAR(36)     NOT NULL,
  interview_type         ENUM('phone','video','in_person','panel','technical','hr','final','ai_screening') NOT NULL,
  round_number           INT          NOT NULL DEFAULT 1,
  scheduled_at           DATETIME     NOT NULL,
  duration_mins          INT          NOT NULL DEFAULT 60,
  location               VARCHAR(255)          DEFAULT NULL,
  meeting_link           VARCHAR(500)          DEFAULT NULL,
  status                 ENUM('scheduled','confirmed','in_progress','completed','cancelled','rescheduled','no_show') NOT NULL DEFAULT 'scheduled',
  scheduling_status      ENUM('pending_candidate','candidate_scheduled','client_acknowledged','meeting_shared','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending_candidate',
  candidate_proposed_at  DATETIME              DEFAULT NULL,
  candidate_notes        TEXT                  DEFAULT NULL,
  client_acknowledged_at DATETIME              DEFAULT NULL,
  client_acknowledged_by CHAR(36)              DEFAULT NULL,
  mediator_id            CHAR(36)              DEFAULT NULL,
  mediator_joined_at     DATETIME              DEFAULT NULL,
  mediator_notes         TEXT                  DEFAULT NULL,
  interview_notes        TEXT                  DEFAULT NULL,
  ai_questions           JSON                  DEFAULT NULL,
  created_by             CHAR(36)     NOT NULL,
  created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  INDEX idx_application (application_id),
  INDEX idx_scheduled   (tenant_id, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_interview_feedback (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id      CHAR(36)     NOT NULL,
  interview_id   CHAR(36)     NOT NULL,
  interviewer_id CHAR(36)     NOT NULL,
  overall_rating TINYINT      NOT NULL,
  recommendation ENUM('strong_yes','yes','maybe','no','strong_no') NOT NULL,
  skills_scores  JSON                  DEFAULT NULL,
  strengths      TEXT                  DEFAULT NULL,
  concerns       TEXT                  DEFAULT NULL,
  notes          TEXT                  DEFAULT NULL,
  submitted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (interview_id) REFERENCES bmi_interview(id) ON DELETE CASCADE,
  UNIQUE KEY uq_interview_interviewer (interview_id, interviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_interview_transcript (
  id                       CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  interview_id             CHAR(36)     NOT NULL,
  transcript_text          LONGTEXT              DEFAULT NULL,
  transcript_json          JSON                  DEFAULT NULL,
  recording_url            VARCHAR(500)          DEFAULT NULL,
  recording_duration_secs  INT                   DEFAULT NULL,
  captured_by              CHAR(36)              DEFAULT NULL,
  captured_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interview (interview_id),
  CONSTRAINT fk_transcript_interview FOREIGN KEY (interview_id) REFERENCES bmi_interview(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bmi_interview_recording (
  id               CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  interview_id     CHAR(36)     NOT NULL,
  recording_url    VARCHAR(500) NOT NULL,
  segment_index    INT          NOT NULL DEFAULT 0,
  duration_seconds INT                   DEFAULT NULL,
  file_size_bytes  BIGINT                DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interview (interview_id),
  CONSTRAINT fk_recording_interview FOREIGN KEY (interview_id) REFERENCES bmi_interview(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. OFFERS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_offer (
  id                    CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id             CHAR(36)     NOT NULL,
  application_id        CHAR(36)     NOT NULL,
  offer_number          VARCHAR(50)  NOT NULL,
  designation           VARCHAR(255) NOT NULL,
  department_id         CHAR(36)              DEFAULT NULL,
  location_id           CHAR(36)              DEFAULT NULL,
  joining_date          DATE                  DEFAULT NULL,
  offer_expiry_date     DATE                  DEFAULT NULL,
  ctc_annual            DECIMAL(12,2) NOT NULL,
  salary_components     JSON                  DEFAULT NULL,
  offer_letter_url      VARCHAR(500)          DEFAULT NULL,
  status                ENUM('draft','pending_approval','approved','sent','accepted','declined','revoked','expired') NOT NULL DEFAULT 'draft',
  approved_by           CHAR(36)              DEFAULT NULL,
  approved_at           DATETIME              DEFAULT NULL,
  sent_at               DATETIME              DEFAULT NULL,
  candidate_response_at DATETIME              DEFAULT NULL,
  decline_reason        TEXT                  DEFAULT NULL,
  created_by            CHAR(36)     NOT NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_offer (tenant_id, offer_number),
  INDEX idx_application (application_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. AI ENGINE
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_ai_screening_result (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  application_id   CHAR(36)     NOT NULL UNIQUE,
  job_id           CHAR(36)     NOT NULL,
  model_used       VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-6',
  match_score      DECIMAL(5,2) NOT NULL,
  skill_match      JSON                  DEFAULT NULL,
  experience_match TINYINT(1)   NOT NULL DEFAULT 0,
  salary_match     TINYINT(1)   NOT NULL DEFAULT 0,
  red_flags        JSON                  DEFAULT NULL,
  recommendation   ENUM('shortlist','maybe','reject') NOT NULL,
  summary          TEXT         NOT NULL,
  tokens_used      INT          NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  reference_id  CHAR(36)              DEFAULT NULL,
  notes         VARCHAR(255)          DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_date (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 90% rule tracking (profile match + assessment combined check)
CREATE TABLE IF NOT EXISTS bmi_match_result (
  id                CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  application_id    CHAR(36)     NOT NULL,
  profile_match_pct DECIMAL(5,2)          DEFAULT NULL,
  assessment_pct    DECIMAL(5,2)          DEFAULT NULL,
  profile_passed    TINYINT(1)            DEFAULT 0,
  assessment_passed TINYINT(1)            DEFAULT 0,
  both_passed       TINYINT(1)            DEFAULT 0,
  checked_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (application_id),
  CONSTRAINT fk_match_app FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_notification_log (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id        CHAR(36)     NOT NULL,
  channel          ENUM('email','sms','whatsapp','in_app') NOT NULL,
  recipient_type   VARCHAR(50)  NOT NULL DEFAULT 'candidate' COMMENT 'candidate | user | admin | all',
  recipient_id     CHAR(36)     NOT NULL,
  recipient_email  VARCHAR(255)          DEFAULT NULL,
  recipient_mobile VARCHAR(20)           DEFAULT NULL,
  subject          VARCHAR(500)          DEFAULT NULL,
  body             TEXT                  DEFAULT NULL,
  event_key        VARCHAR(100)          DEFAULT NULL,
  reference_id     CHAR(36)              DEFAULT NULL,
  reference_type   VARCHAR(100)          DEFAULT NULL,
  status           ENUM('queued','sent','failed','delivered','bounced') NOT NULL DEFAULT 'sent',
  provider_ref     VARCHAR(255)          DEFAULT NULL,
  error_message    TEXT                  DEFAULT NULL,
  sent_at          DATETIME              DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_reference (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. COMPANY MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_company_media (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id   CHAR(36)     NOT NULL,
  media_type  ENUM('photo','achievement','project','banner') NOT NULL DEFAULT 'photo',
  title       VARCHAR(300)          DEFAULT NULL,
  description TEXT                  DEFAULT NULL,
  file_url    VARCHAR(500) NOT NULL,
  sort_order  INT                   DEFAULT 0,
  created_at  DATETIME              DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant (tenant_id),
  INDEX idx_type   (tenant_id, media_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. BILLING
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_subscription (
  id                   CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id            CHAR(36)     NOT NULL UNIQUE,
  plan                 ENUM('starter','growth','enterprise','white_label') NOT NULL,
  billing_cycle        ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  status               ENUM('active','past_due','cancelled','trialing','paused') NOT NULL DEFAULT 'trialing',
  razorpay_sub_id      VARCHAR(255)          DEFAULT NULL,
  amount               DECIMAL(10,2) NOT NULL,
  currency             VARCHAR(3)   NOT NULL DEFAULT 'INR',
  trial_ends_at        DATETIME              DEFAULT NULL,
  current_period_start DATETIME              DEFAULT NULL,
  current_period_end   DATETIME              DEFAULT NULL,
  cancelled_at         DATETIME              DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_audit_log (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id   CHAR(36)     NOT NULL,
  actor_id    CHAR(36)              DEFAULT NULL,
  actor_email VARCHAR(255)          DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   CHAR(36)              DEFAULT NULL,
  old_values  JSON                  DEFAULT NULL,
  new_values  JSON                  DEFAULT NULL,
  ip_address  VARCHAR(45)           DEFAULT NULL,
  user_agent  TEXT                  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  INDEX idx_tenant_entity (tenant_id, entity_type, entity_id),
  INDEX idx_tenant_date   (tenant_id, created_at),
  INDEX idx_actor         (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS bmi_hiring_metric_daily (
  id                    CHAR(36)  NOT NULL DEFAULT (UUID()) PRIMARY KEY,
  tenant_id             CHAR(36)  NOT NULL,
  job_id                CHAR(36)           DEFAULT NULL,
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
  avg_time_to_hire_days DECIMAL(6,2)       DEFAULT NULL,
  ai_credits_consumed   INT       NOT NULL DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES bmi_tenant(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tenant_job_date (tenant_id, job_id, metric_date),
  INDEX idx_tenant_date (tenant_id, metric_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED DATA
-- ============================================================

-- 1. Super Admin (email: superadmin@bookmyinterview.in / password: Admin@123)
INSERT IGNORE INTO bmi_platform_admin (id, email, password_hash, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin@bookmyinterview.in',
  '$2b$10$01TVJhMUoSAezgZQrd05u.EJh7Q2V4aZomn3VLNSHywcNFFQGyhdC',
  'Super Admin'
);

-- 2. Demo tenant (the client company)
INSERT IGNORE INTO bmi_tenant
  (id, tenant_code, company_name, industry, company_size, plan, ai_credits, subscription_status)
VALUES
  ('11111111-1111-1111-1111-111111111111',
   'BMI-DEMO', 'Book My Interview Demo', 'Technology', '51-200', 'enterprise', 10000, 'active');

-- 3. Client Admin user (email: admin@bookmyinterview.in / password: Admin@123)
INSERT IGNORE INTO bmi_user (id, tenant_id, email, password_hash, full_name, role)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'admin@bookmyinterview.in',
  '$2b$10$rOyDgaJkF4HBuKpKFLjJBOVQ6Uz2J5GMnWfOqG6TH8NOAVvYWCLim',
  'System Admin',
  'super_admin'
);

-- 4. Seed departments and locations for demo tenant
INSERT IGNORE INTO bmi_department (id, tenant_id, name, code) VALUES
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Engineering',       'ENG'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Human Resources',   'HR'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Sales',             'SALES'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Operations',        'OPS'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Quality Assurance', 'QA');

INSERT IGNORE INTO bmi_location (id, tenant_id, city, state, country) VALUES
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Mumbai',    'Maharashtra', 'India'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Pune',      'Maharashtra', 'India'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Delhi',     'Delhi',       'India'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Bangalore', 'Karnataka',   'India'),
  (UUID(), '11111111-1111-1111-1111-111111111111', 'Hyderabad', 'Telangana',   'India');

-- ============================================================
-- PLATFORM QUESTION BANK (100+ questions across 20+ skills)
-- ============================================================

INSERT IGNORE INTO bmi_platform_question_bank
  (id, question_text, question_type, options, correct_answer, skills, category, difficulty, marks, explanation)
VALUES
-- JAVASCRIPT
(UUID(),'Which of the following is NOT a JavaScript data type?','single_choice','["String","Boolean","Character","Number"]','[2]','["JavaScript"]','Frontend','easy',1,'JavaScript does not have a Character type; it uses strings for single characters.'),
(UUID(),'What does the `===` operator do in JavaScript?','single_choice','["Assigns a value","Compares value only","Compares value and type","Compares reference"]','[2]','["JavaScript"]','Frontend','easy',1,'=== is the strict equality operator that compares both value and type.'),
(UUID(),'Which method adds an element to the end of an array?','single_choice','["pop()","push()","shift()","unshift()"]','[1]','["JavaScript"]','Frontend','easy',1,'push() appends a new element to the end of an array.'),
(UUID(),'What is the output of `typeof null` in JavaScript?','single_choice','["null","undefined","object","boolean"]','[2]','["JavaScript"]','Frontend','medium',1,'typeof null returns "object" — a well-known JavaScript bug from its first release.'),
(UUID(),'Which of the following is true about closures in JavaScript?','single_choice','["They only work with arrow functions","They have access to outer function variables","They cannot return values","They are only used in loops"]','[1]','["JavaScript"]','Frontend','medium',2,'A closure has access to its outer function scope even after the outer function has returned.'),
(UUID(),'What method creates a new array with elements that pass a test?','single_choice','["forEach()","map()","filter()","reduce()"]','[2]','["JavaScript"]','Frontend','easy',1,'filter() creates a new array with all elements that pass the provided test function.'),
(UUID(),'What is the event propagation order in the DOM?','single_choice','["Bubbling then Capturing","Capturing then Bubbling","Only Bubbling","Random order"]','[1]','["JavaScript"]','Frontend','hard',2,'DOM events first capture (window to target) then bubble (target to window).'),
(UUID(),'Which statement correctly declares a constant in JavaScript?','single_choice','["let x = 5","var x = 5","const x = 5","constant x = 5"]','[2]','["JavaScript"]','Frontend','easy',1,'const is used to declare block-scoped constants that cannot be reassigned.'),
-- REACT
(UUID(),'What is the virtual DOM in React?','single_choice','["The actual browser DOM","A lightweight copy of the DOM","A separate database","A CSS framework"]','[1]','["React"]','Frontend','easy',1,'The virtual DOM is a lightweight JavaScript representation of the actual DOM.'),
(UUID(),'Which hook is used for side effects in React?','single_choice','["useState","useEffect","useContext","useReducer"]','[1]','["React"]','Frontend','easy',1,'useEffect handles side effects like data fetching, subscriptions, and DOM manipulation.'),
(UUID(),'What does the `key` prop do in React lists?','single_choice','["Styles the list","Helps identify changed items","Adds a key to the DOM","Increases performance automatically"]','[1]','["React"]','Frontend','medium',1,'The key prop helps React identify which items have changed, been added, or removed.'),
(UUID(),'What is the correct way to update state in React?','single_choice','["state = newValue","this.state = newValue","setState(newValue)","updateState(newValue)"]','[2]','["React"]','Frontend','easy',1,'setState (or the setter from useState) is the proper way to update state in React.'),
(UUID(),'Which of the following is NOT a React lifecycle method?','single_choice','["componentDidMount","componentWillUnmount","componentShouldUpdate","componentDidUpdate"]','[2]','["React"]','Frontend','medium',1,'There is no componentShouldUpdate — it is shouldComponentUpdate.'),
-- NODE.JS
(UUID(),'What is npm?','single_choice','["Node Package Manager","Node Process Manager","Next Package Module","Native Package Middleware"]','[0]','["Node.js"]','Backend','easy',1,'npm stands for Node Package Manager, the default package manager for Node.js.'),
(UUID(),'Which method reads a file asynchronously in Node.js?','single_choice','["fs.readFileSync()","fs.readFile()","fs.read()","fs.readAsync()"]','[1]','["Node.js"]','Backend','easy',1,'fs.readFile() reads files asynchronously. readFileSync() is the synchronous version.'),
(UUID(),'What is middleware in Express.js?','single_choice','["A database driver","Functions that execute during the request-response cycle","A templating engine","A type of route"]','[1]','["Node.js"]','Backend','medium',1,'Middleware functions have access to the request and response objects and run during the request-response cycle.'),
(UUID(),'What does the `require()` function do in Node.js?','single_choice','["Executes a shell command","Imports modules","Creates a new file","Defines a variable"]','[1]','["Node.js"]','Backend','easy',1,'require() imports modules, JSON, and local files in Node.js.'),
(UUID(),'Which of these is a built-in Node.js module?','single_choice','["http","express","mongoose","axios"]','[0]','["Node.js"]','Backend','medium',1,'http is a built-in Node.js module. express, mongoose, and axios are third-party packages.'),
-- SQL
(UUID(),'Which SQL statement retrieves data from a database?','single_choice','["GET","FETCH","SELECT","EXTRACT"]','[2]','["SQL"]','Backend','easy',1,'SELECT is used to query/retrieve data from a database table.'),
(UUID(),'What does the JOIN clause do in SQL?','single_choice','["Combines rows from two tables","Deletes duplicate rows","Sorts the results","Groups results by a column"]','[0]','["SQL"]','Backend','easy',1,'JOIN combines rows from two or more tables based on a related column.'),
(UUID(),'What is the purpose of the PRIMARY KEY constraint?','single_choice','["Allows NULL values","Uniquely identifies each row","Enforces a default value","Creates an index automatically"]','[1]','["SQL"]','Backend','easy',1,'A PRIMARY KEY uniquely identifies each row and cannot contain NULL values.'),
(UUID(),'Which aggregate function counts the number of rows?','single_choice','["SUM()","AVG()","COUNT()","TOTAL()"]','[2]','["SQL"]','Backend','easy',1,'COUNT() returns the number of rows matching a specified condition.'),
(UUID(),'What does the HAVING clause do in SQL?','single_choice','["Filters rows before grouping","Filters groups after GROUP BY","Sorts the results","Limits the number of rows"]','[1]','["SQL"]','Backend','medium',1,'HAVING filters groups created by GROUP BY, while WHERE filters individual rows.'),
-- PYTHON
(UUID(),'Which of these is NOT a Python data type?','single_choice','["List","Dictionary","Array","Tuple"]','[2]','["Python"]','Backend','easy',1,'Python has lists as a built-in type, not arrays (arrays exist in the array module).'),
(UUID(),'How do you create a list comprehension in Python?','single_choice','["[x for x in range(10)]","list(x for x in range(10))","for x in range(10): list.add(x)","{x for x in range(10)}"]','[0]','["Python"]','Backend','medium',1,'List comprehensions: [expression for item in iterable].'),
(UUID(),'What does the `len()` function do in Python?','single_choice','["Returns the last element","Returns the length of an object","Converts to lowercase","Creates a new list"]','[1]','["Python"]','Backend','easy',1,'len() returns the number of items in an object like a string, list, or dictionary.'),
(UUID(),'Which keyword is used to define a function in Python?','single_choice','["function","def","func","define"]','[1]','["Python"]','Backend','easy',1,'def is the keyword used to define functions in Python.'),
-- JAVA
(UUID(),'What is the JVM?','single_choice','["Java Visual Machine","Java Virtual Machine","Java Variable Manager","Java Version Manager"]','[1]','["Java"]','Backend','easy',1,'JVM = Java Virtual Machine — it runs Java bytecode.'),
(UUID(),'Which keyword is used to inherit a class in Java?','single_choice','["inherit","extends","implements","super"]','[1]','["Java"]','Backend','easy',1,'extends is used for class inheritance. implements is used for interfaces.'),
(UUID(),'What is the difference between `==` and `.equals()` in Java?','single_choice','["They are the same","== compares reference, .equals() compares value","== compares value, .equals() compares reference","Both compare reference"]','[1]','["Java"]','Backend','medium',2,'== compares object references, while .equals() compares content/value.'),
-- HTML / CSS
(UUID(),'What does HTML stand for?','single_choice','["HyperText Markup Language","High Tech Modern Language","HyperTransfer Markup Language","Home Tool Markup Language"]','[0]','["HTML"]','Frontend','easy',1,'HTML = HyperText Markup Language, the standard language for web pages.'),
(UUID(),'Which tag is used for the largest heading in HTML?','single_choice','["<heading>","<h6>","<h1>","<header>"]','[2]','["HTML"]','Frontend','easy',1,'<h1> defines the most important/largest heading.'),
(UUID(),'What does the `alt` attribute do in an `<img>` tag?','single_choice','["Adds a title","Provides alternative text","Sets the image height","Links to another image"]','[1]','["HTML"]','Frontend','easy',1,'The alt attribute provides alternative text if the image cannot be displayed.'),
(UUID(),'What does CSS stand for?','single_choice','["Computer Style Sheets","Cascading Style Sheets","Creative Style System","Colorful Style Sheets"]','[1]','["CSS"]','Frontend','easy',1,'CSS = Cascading Style Sheets, used to style HTML elements.'),
(UUID(),'Which property makes a flexbox container?','single_choice','["display: block","display: flex","display: inline","position: relative"]','[1]','["CSS"]','Frontend','easy',1,'display: flex creates a flexbox container and enables flex properties on children.'),
(UUID(),'What does `z-index` control?','single_choice','["Horizontal position","Stacking order","Font size","Element width"]','[1]','["CSS"]','Frontend','easy',1,'z-index controls the stacking order of positioned elements. Higher values appear on top.'),
-- TYPESCRIPT
(UUID(),'What is the main benefit of TypeScript over JavaScript?','single_choice','["Faster runtime","Static type checking","Smaller bundle size","Built-in database"]','[1]','["TypeScript"]','Frontend','medium',1,'TypeScript adds optional static typing to catch errors at compile time rather than runtime.'),
(UUID(),'How do you define an interface in TypeScript?','single_choice','["interface User { name: string }","object User { name: string }","class User { name: string }","type User = { name: string }"]','[0]','["TypeScript"]','Frontend','medium',1,'Both interface and type can define object shapes, but interface is the traditional way.'),
-- MONGODB
(UUID(),'What type of database is MongoDB?','single_choice','["Relational","Document-oriented","Key-value","Graph"]','[1]','["MongoDB"]','Backend','easy',1,'MongoDB is a NoSQL document-oriented database that stores data in JSON-like documents.'),
(UUID(),'What is the equivalent of a table in MongoDB?','single_choice','["Document","Collection","Record","Row"]','[1]','["MongoDB"]','Backend','easy',1,'In MongoDB, a collection is the equivalent of a table in relational databases.'),
-- DOCKER
(UUID(),'What is Docker primarily used for?','single_choice','["Version control","Containerization","Database management","Load balancing"]','[1]','["Docker"]','DevOps','easy',1,'Docker is a containerization platform that packages applications and dependencies into containers.'),
(UUID(),'What is a Dockerfile?','single_choice','["A running container","A script to build an image","A configuration for networking","A database schema"]','[1]','["Docker"]','DevOps','medium',1,'A Dockerfile is a script containing instructions to build a Docker image.'),
-- AWS
(UUID(),'Which AWS service is used for virtual servers?','single_choice','["S3","Lambda","EC2","RDS"]','[2]','["AWS"]','DevOps','medium',1,'Amazon EC2 (Elastic Compute Cloud) provides virtual servers in the cloud.'),
(UUID(),'What does S3 stand for in AWS?','single_choice','["Simple Storage Service","Server Security System","Scalable Server Solution","System Storage Service"]','[0]','["AWS"]','DevOps','medium',1,'Amazon S3 = Simple Storage Service, an object storage service.'),
-- GIT
(UUID(),'Which command creates a new Git repository?','single_choice','["git start","git new","git init","git create"]','[2]','["Git"]','DevOps','easy',1,'git init initializes a new Git repository in the current directory.'),
(UUID(),'What does `git commit -m "message"` do?','single_choice','["Deletes changes","Saves staged changes with a message","Creates a new branch","Merges branches"]','[1]','["Git"]','DevOps','easy',1,'git commit saves all staged changes with a descriptive message.'),
-- DATA STRUCTURES & ALGORITHMS
(UUID(),'What is the time complexity of accessing an element in an array by index?','single_choice','["O(1)","O(n)","O(log n)","O(n^2)"]','[0]','["Data Structures"]','DSA','easy',2,'Accessing by index is O(1) constant time since arrays use direct memory addressing.'),
(UUID(),'Which data structure operates on LIFO principle?','single_choice','["Queue","Stack","Linked List","Tree"]','[1]','["Data Structures"]','DSA','easy',1,'A Stack follows Last-In-First-Out (LIFO).'),
(UUID(),'What is a hash table collision?','single_choice','["When two keys hash to the same index","When the table is full","When a key is deleted","When the hash function fails"]','[0]','["Data Structures"]','DSA','medium',2,'A collision occurs when two different keys produce the same hash index.'),
(UUID(),'Which traversal visits left subtree, then root, then right subtree?','single_choice','["Preorder","Inorder","Postorder","Level order"]','[1]','["Data Structures"]','DSA','medium',2,'Inorder: Left → Root → Right. Visits nodes in ascending order in a BST.'),
(UUID(),'What is the time complexity of binary search?','single_choice','["O(1)","O(n)","O(log n)","O(n log n)"]','[2]','["Algorithms"]','DSA','medium',2,'Binary search has O(log n) time complexity as it halves the search space each step.'),
(UUID(),'Which algorithm sorts by repeatedly selecting the minimum element?','single_choice','["Bubble Sort","Selection Sort","Merge Sort","Quick Sort"]','[1]','["Algorithms"]','DSA','medium',1,'Selection Sort repeatedly finds the minimum element and moves it to the sorted portion.'),
(UUID(),'What is the space complexity of merge sort?','single_choice','["O(1)","O(n)","O(log n)","O(n log n)"]','[1]','["Algorithms"]','DSA','hard',2,'Merge sort requires O(n) additional space for temporary arrays during merging.'),
-- SYSTEM DESIGN
(UUID(),'What is load balancing?','single_choice','["Distributing traffic across servers","Reducing database size","Compressing files","Encrypting data"]','[0]','["System Design"]','System Design','medium',2,'Load balancing distributes incoming network traffic across multiple servers.'),
(UUID(),'What is the CAP theorem about?','single_choice','["Consistency, Availability, Partition Tolerance","Caching, Authorization, Performance","Capacity, Access, Protocol","Concurrency, Atomicity, Parallelism"]','[0]','["System Design"]','System Design','hard',2,'CAP theorem: a distributed system can guarantee only two of Consistency, Availability, Partition Tolerance.'),
-- DATABASES
(UUID(),'What is database indexing?','single_choice','["A data structure that speeds up queries","A way to encrypt data","A backup strategy","A normalization technique"]','[0]','["Databases"]','Backend','medium',1,'An index is a data structure that improves the speed of data retrieval operations.'),
(UUID(),'What is database normalization?','single_choice','["Adding redundant data","Organizing data to reduce redundancy","Encrypting database tables","Creating backups"]','[1]','["Databases"]','Backend','medium',1,'Normalization organizes data to minimize redundancy by dividing large tables into smaller ones.'),
-- SOFT SKILLS
(UUID(),'What is active listening in a professional context?','single_choice','["Speaking more than listening","Fully concentrating on what is being said","Taking notes without eye contact","Interrupting to ask questions"]','[1]','["Communication"]','Soft Skills','easy',1,'Active listening means fully concentrating, understanding, responding, and remembering what is said.'),
(UUID(),'Which is the best approach when giving constructive feedback?','single_choice','["Focus only on negatives","Be specific and suggest improvement","Compare with other employees","Give feedback publicly"]','[1]','["Communication"]','Soft Skills','medium',1,'Effective feedback is specific, focused on behavior, and includes suggestions for improvement.'),
-- PROJECT MANAGEMENT
(UUID(),'What is a sprint in Scrum?','single_choice','["A quick meeting","A time-boxed iteration","A project deadline","A documentation review"]','[1]','["Project Management"]','Management','easy',1,'A sprint is a time-boxed period (usually 1-4 weeks) during which a team completes a set amount of work.'),
(UUID(),'Who is responsible for the product backlog in Scrum?','single_choice','["Scrum Master","Product Owner","Development Team","Stakeholders"]','[1]','["Project Management"]','Management','medium',1,'The Product Owner is responsible for maintaining and prioritizing the product backlog.'),
-- SALES & HR
(UUID(),'What does B2B stand for in sales?','single_choice','["Back to Business","Business to Business","Business to Buyer","Brand to Business"]','[1]','["Sales"]','Sales','easy',1,'B2B = Business to Business, sales between companies rather than to individual consumers.'),
(UUID(),'What is a sales pipeline?','single_choice','["A physical pipe","Visual stages of the sales process","A list of customers","A pricing strategy"]','[1]','["Sales"]','Sales','medium',1,'A sales pipeline visually represents the stages a prospect moves through from lead to customer.'),
(UUID(),'What is the purpose of a job description?','single_choice','["To advertise the company","To outline role responsibilities and requirements","To set salary expectations only","To list company benefits"]','[1]','["HR"]','HR','easy',1,'A job description outlines the responsibilities, requirements, and expectations for a role.'),
(UUID(),'What does KPI stand for in performance management?','single_choice','["Key Performance Indicator","Key Personnel Index","Knowledge Process Integration","Key Planning Initiative"]','[0]','["HR"]','HR','easy',1,'KPI = Key Performance Indicator, a measurable value showing how effectively objectives are being met.'),
-- DATA ANALYSIS
(UUID(),'What is the difference between mean and median?','single_choice','["They are the same","Mean is average, median is the middle value","Mean is the middle, median is average","Both are types of charts"]','[1]','["Data Analysis"]','Data','easy',1,'Mean is the arithmetic average; median is the middle value when data is sorted.'),
(UUID(),'What does a p-value tell you in statistics?','single_choice','["The exact value of the mean","Probability of observing results by chance","The sample size needed","The correlation coefficient"]','[1]','["Data Analysis"]','Data','hard',2,'A p-value indicates the probability of obtaining results as extreme as observed, assuming the null hypothesis.'),
-- CYBERSECURITY
(UUID(),'What is phishing?','single_choice','["A type of firewall","A social engineering attack to steal information","A network scanning tool","An encryption method"]','[1]','["Cybersecurity"]','Security','medium',1,'Phishing is a cyber attack where criminals impersonate legitimate entities to trick victims.'),
(UUID(),'What does HTTPS stand for?','single_choice','["HyperText Transfer Protocol Secure","High Transfer Protocol Standard","Hyper Transfer Standard Protocol","High Tech Protocol System"]','[0]','["Cybersecurity"]','Security','easy',1,'HTTPS = HTTP over TLS/SSL, encrypting data between browser and server.'),
-- MACHINE LEARNING
(UUID(),'What is supervised learning?','single_choice','["Learning without labels","Learning with labeled training data","Learning by trial and error","Learning from rewards"]','[1]','["Machine Learning"]','AI/ML','medium',2,'Supervised learning trains models on labeled data where the desired output is known.'),
(UUID(),'What is overfitting in machine learning?','single_choice','["Model performs well on training but poorly on new data","Model performs well on all data","Model fails to learn anything","Model trains too slowly"]','[0]','["Machine Learning"]','AI/ML','medium',2,'Overfitting: model learns training data too well, including noise, and fails to generalize.'),
(UUID(),'What does NLP stand for?','single_choice','["Natural Language Processing","Neural Learning Protocol","Network Language Protocol","Natural Logic Processing"]','[0]','["Machine Learning"]','AI/ML','medium',1,'NLP = Natural Language Processing, a branch of AI focused on human-computer language interaction.'),
-- ANGULAR & VUE
(UUID(),'What is a component in Angular?','single_choice','["A CSS file","A building block of the UI","A database table","A server endpoint"]','[1]','["Angular"]','Frontend','medium',1,'Components are the fundamental building blocks of Angular applications.'),
(UUID(),'What is data binding in Angular?','single_choice','["Connecting to a database","Synchronizing data between model and view","Linking CSS files","Binding keyboard events"]','[1]','["Angular"]','Frontend','medium',1,'Data binding automatically synchronizes data between the component and the DOM.'),
(UUID(),'What is Vue.js used for?','single_choice','["Server-side programming","Building user interfaces","Database management","Network configuration"]','[1]','["Vue.js"]','Frontend','easy',1,'Vue.js is a progressive JavaScript framework for building user interfaces.'),
(UUID(),'What is the `v-model` directive used for in Vue?','single_choice','["Creating models","Two-way data binding","Adding CSS classes","Handling events"]','[1]','["Vue.js"]','Frontend','medium',1,'v-model creates two-way data bindings on form input elements.'),
-- GO & RUST
(UUID(),'What company developed the Go programming language?','single_choice','["Microsoft","Apple","Google","Facebook"]','[2]','["Go"]','Backend','easy',1,'Go was developed by Google in 2007 and released in 2009.'),
(UUID(),'What is a goroutine in Go?','single_choice','["A debugging tool","A lightweight thread managed by Go runtime","A database connection","A test case"]','[1]','["Go"]','Backend','medium',2,'Goroutines are lightweight threads managed by the Go runtime.'),
(UUID(),'What is Rust primarily known for?','single_choice','["Memory safety without garbage collection","Dynamic typing","Built-in garbage collector","Interpreted language"]','[0]','["Rust"]','Backend','medium',2,'Rust guarantees memory safety through its ownership system without needing a garbage collector.'),
-- KUBERNETES
(UUID(),'What is a pod in Kubernetes?','single_choice','["A storage volume","The smallest deployable unit","A cluster of machines","A network policy"]','[1]','["Kubernetes"]','DevOps','medium',1,'A pod is the smallest Kubernetes object — it represents a single running process instance.'),
(UUID(),'What does Kubernetes do?','single_choice','["Compiles code","Orchestrates containers","Creates databases","Manages user accounts"]','[1]','["Kubernetes"]','DevOps','medium',1,'Kubernetes automates the deployment, scaling, and management of containerized applications.'),
-- TESTING & DEVOPS
(UUID(),'What is unit testing?','single_choice','["Testing the entire application","Testing individual components in isolation","Testing user interface","Testing database performance"]','[1]','["Testing"]','QA','easy',1,'Unit testing verifies that individual units of source code work correctly in isolation.'),
(UUID(),'What is TDD?','single_choice','["Test Driven Development","Technical Design Document","Test Deployment Dashboard","Total Development Duration"]','[0]','["Testing"]','QA','medium',1,'TDD = Test Driven Development, where you write tests before writing the production code.'),
(UUID(),'What is CI/CD?','single_choice','["Continuous Integration / Continuous Deployment","Code Integration / Code Deployment","Centralized Input / Centralized Output","Critical Infrastructure / Critical Data"]','[0]','["DevOps"]','DevOps','medium',1,'CI/CD automates building, testing, and deployment of applications.'),
(UUID(),'What is Infrastructure as Code (IaC)?','single_choice','["Writing infrastructure documentation","Managing infrastructure through machine-readable definition files","Manually configuring servers","Using physical hardware"]','[1]','["DevOps"]','DevOps','hard',2,'IaC manages and provisions infrastructure through code instead of manual processes.'),
-- PROBLEM SOLVING
(UUID(),'What is the first step in solving a complex problem?','single_choice','["Implementing a solution","Understanding and defining the problem","Calling a meeting","Writing code"]','[1]','["Problem Solving"]','Soft Skills','easy',1,'Clearly understanding and defining the problem is the critical first step.'),
(UUID(),'What is root cause analysis?','single_choice','["A method to find symptoms","A process to identify the underlying cause of a problem","A reporting technique","A team-building exercise"]','[1]','["Problem Solving"]','Soft Skills','medium',1,'Root cause analysis identifies the fundamental cause of problems to prevent recurrence.');

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT CONCAT('✅ Database ready. Tables created: ', COUNT(*)) AS status
FROM information_schema.tables
WHERE table_schema = 'getjob' AND table_name LIKE 'bmi_%';

SELECT
  'Super Admin'  AS portal, 'superadmin@bookmyinterview.in' AS email, 'Admin@123' AS password UNION ALL
SELECT
  'Client Admin', 'admin@bookmyinterview.in', 'Admin@123';
