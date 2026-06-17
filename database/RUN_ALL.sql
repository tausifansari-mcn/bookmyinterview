-- ============================================================
-- BOOK MY INTERVIEW — MASTER SETUP SCRIPT
-- ============================================================
-- Run this single file in MySQL Workbench to create the
-- entire schema + seed data in the correct order.
--
-- Steps:
--   1. Open MySQL Workbench
--   2. Connect to 122.184.128.90 with your credentials
--   3. File → Open SQL Script → select this file
--   4. Click the lightning bolt (Run)
--
-- IMPORTANT: This uses SOURCE which only works in the MySQL
-- CLI. For Workbench, run files individually (00 → 15) OR
-- copy-paste each file's content in sequence.
--
-- Admin login after seed:
--   Email   : admin@bookmyinterview.in
--   Password: Admin@123
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- STEP 0 — Create database
-- ──────────────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS `suggest`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `suggest`;

-- ──────────────────────────────────────────────────────────────
-- Run individual files in MySQL CLI (run from project root):
--
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/01_tenants.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/02_users_auth.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/03_org_masters.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/04_jobs.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/05_candidates.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/06_applications.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/07_interviews.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/08_offers.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/09_assessments.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/10_bgv.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/11_ai_engine.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/12_notifications.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/13_billing.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/14_audit_analytics.sql
--   mysql -h 122.184.128.90 -u YOUR_USER -p suggest < database/15_seed_data.sql
-- ──────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────
-- WORKBENCH USERS: Paste each file below in sequence.
-- Content of each file begins after its header comment.
-- ──────────────────────────────────────────────────────────────

-- ─── TABLE SUMMARY ────────────────────────────────────────────
-- 01  bmi_tenant
-- 02  bmi_user, bmi_refresh_token, bmi_password_reset
-- 03  bmi_department, bmi_location, bmi_pipeline_template, bmi_pipeline_stage
-- 04  bmi_job, bmi_job_board_post
-- 05  bmi_candidate, bmi_candidate_document, bmi_candidate_portal_session
-- 06  bmi_application, bmi_application_stage_log
-- 07  bmi_interview, bmi_interview_panelist, bmi_interview_feedback
-- 08  bmi_offer, bmi_offer_approval_log
-- 09  bmi_assessment, bmi_assessment_attempt
-- 10  bmi_bgv_request, bmi_bgv_webhook_log
-- 11  bmi_ai_screening_result, bmi_ai_jd_history, bmi_ai_credit_ledger
-- 12  bmi_email_template, bmi_notification_log, bmi_in_app_notification
-- 13  bmi_subscription, bmi_invoice, bmi_ai_credit_topup
-- 14  bmi_audit_log, bmi_hiring_metric_daily, bmi_source_metric_daily
-- 15  Seed: Demo tenant + admin user + departments + locations + pipeline + job
-- ─── TOTAL: 27 tables ─────────────────────────────────────────

-- Final verification query — run after all 15 files succeed:
SELECT
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'suggest'
  AND TABLE_NAME LIKE 'bmi_%'
ORDER BY CREATE_TIME;
