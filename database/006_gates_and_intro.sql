-- ============================================================
-- Migration 006 — Short Intro Scoring + Meeting Link + Interview Slot
-- ============================================================

-- Add intro scoring columns to candidate
ALTER TABLE bmi_candidate
  ADD COLUMN IF NOT EXISTS intro_score       DECIMAL(5,2) DEFAULT NULL COMMENT 'AI-evaluated intro score 0-100',
  ADD COLUMN IF NOT EXISTS intro_transcript  TEXT         DEFAULT NULL COMMENT 'Candidate intro text or AI transcript',
  ADD COLUMN IF NOT EXISTS intro_feedback    TEXT         DEFAULT NULL COMMENT 'AI feedback on the intro';

-- Add interview slot + meeting link to application
ALTER TABLE bmi_application
  ADD COLUMN IF NOT EXISTS interview_slot_at   DATETIME     DEFAULT NULL COMMENT 'Candidate-selected interview slot',
  ADD COLUMN IF NOT EXISTS meeting_link        VARCHAR(500) DEFAULT NULL COMMENT 'Meeting link sent by client';
