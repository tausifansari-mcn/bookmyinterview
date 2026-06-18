-- Migration 11: Add missing columns to bmi_assessment and bmi_interview

-- ── bmi_assessment: add job_id, time_limit_mins, passing_score, shuffle_qs, show_result ──
ALTER TABLE bmi_assessment
  ADD COLUMN job_id          VARCHAR(36)   NULL                AFTER tenant_id,
  ADD COLUMN time_limit_mins INT           NOT NULL DEFAULT 30  AFTER instructions,
  ADD COLUMN passing_score   DECIMAL(5,2)  NOT NULL DEFAULT 60  AFTER time_limit_mins,
  ADD COLUMN shuffle_qs      TINYINT(1)    NOT NULL DEFAULT 0   AFTER passing_score,
  ADD COLUMN show_result     TINYINT(1)    NOT NULL DEFAULT 1   AFTER shuffle_qs,
  ADD UNIQUE KEY uniq_job_assessment (job_id);

-- ── bmi_interview: add candidate_id, job_id, round_name, mode, interviewer_ids, feedback, rating, recommendation ──
ALTER TABLE bmi_interview
  ADD COLUMN candidate_id    VARCHAR(36)                                       NULL AFTER application_id,
  ADD COLUMN job_id          VARCHAR(36)                                       NULL AFTER candidate_id,
  ADD COLUMN round_name      VARCHAR(100)                                      NULL AFTER interview_type,
  ADD COLUMN mode            ENUM('online','offline','phone') NOT NULL DEFAULT 'online' AFTER round_name,
  ADD COLUMN interviewer_ids JSON                                              NULL AFTER mode,
  ADD COLUMN feedback        TEXT                                              NULL AFTER interview_notes,
  ADD COLUMN rating          DECIMAL(3,1)                                     NULL AFTER feedback,
  ADD COLUMN recommendation  ENUM('selected','rejected','on_hold','next_round') NULL AFTER rating;
