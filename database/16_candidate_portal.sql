-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 16: Add password_hash to bmi_candidate for portal login
-- Run this in MySQL Workbench on getjob database
-- ============================================================

USE `getjob`;

-- Add password_hash column for candidate self-service portal login
ALTER TABLE `bmi_candidate`
  ADD COLUMN `password_hash` VARCHAR(255) DEFAULT NULL AFTER `email`;

SELECT 'Column password_hash added to bmi_candidate.' AS status;
