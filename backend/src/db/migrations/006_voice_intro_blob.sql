-- Migration 006 — Store voice/video intro as LONGBLOB in bmi_candidate
-- Previously files were saved to disk; now stored directly in the database.

ALTER TABLE bmi_candidate
  ADD COLUMN IF NOT EXISTS voice_intro_data LONGBLOB     NULL AFTER voice_intro_duration,
  ADD COLUMN IF NOT EXISTS voice_intro_mime VARCHAR(100)  NULL AFTER voice_intro_data;
