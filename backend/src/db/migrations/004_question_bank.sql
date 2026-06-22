-- ============================================================
-- Migration 004 — Platform Question Bank & Auto-Assessment
-- Huge skill-tagged question bank + auto-assessment generation
-- ============================================================

-- 1. Platform-wide question bank (no tenant isolation — managed by super admin)
CREATE TABLE IF NOT EXISTS bmi_platform_question_bank (
  id              CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  question_text   TEXT         NOT NULL,
  question_type   ENUM('single_choice','multi_choice','true_false') NOT NULL DEFAULT 'single_choice',
  options         JSON         NOT NULL COMMENT '["Option A", "Option B", "Option C", "Option D"]',
  correct_answer  JSON         NOT NULL COMMENT '[0] for single_choice, [0,2] for multi_choice',
  skills          JSON         NOT NULL COMMENT '["JavaScript", "React", "Node.js"]',
  category        VARCHAR(100) NULL COMMENT 'e.g. Frontend, Backend, DevOps, DSA, HR, Sales',
  difficulty      ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  marks           INT          NOT NULL DEFAULT 1,
  explanation     TEXT         NULL,
  is_active       TINYINT(1)   DEFAULT 1,
  created_by      CHAR(36)     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_skills     ((CAST(skills AS CHAR(255)))),
  INDEX idx_category   (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_active     (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Platform-wide MCQ question bank tagged with skills — used for auto-assessment generation';

-- 2. Auto-generated assessment log (tracks which questions were pulled for which application)
CREATE TABLE IF NOT EXISTS bmi_assessment_auto_log (
  id              CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  application_id  CHAR(36)     NOT NULL,
  job_id          CHAR(36)     NOT NULL,
  question_ids    JSON         NOT NULL COMMENT 'Array of question IDs pulled from bank',
  skills_matched  JSON         NULL     COMMENT 'Skills used to filter questions',
  total_questions INT          NOT NULL DEFAULT 0,
  total_marks     INT          NOT NULL DEFAULT 0,
  passing_score   DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_application (application_id),
  INDEX idx_job         (job_id),
  CONSTRAINT fk_auto_app FOREIGN KEY (application_id) REFERENCES bmi_application(id) ON DELETE CASCADE,
  CONSTRAINT fk_auto_job FOREIGN KEY (job_id)         REFERENCES bmi_job(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks auto-generated assessment questions pulled from platform question bank';
