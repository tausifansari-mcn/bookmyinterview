-- ============================================================
-- FIX: Insert seed users + correct password hash
-- Password for all users: Admin@123
-- Run in MySQL Workbench on getjob database
-- ============================================================

USE `getjob`;

-- Step 1: Ensure demo tenant exists
INSERT INTO `bmi_tenant` (`id`, `tenant_code`, `company_name`, `industry`, `company_size`, `country`, `timezone`, `plan`, `ai_credits`, `is_active`)
VALUES ('bmi0-0000-0000-0000-000000000001', 'DEMO', 'Book My Interview Demo', 'Technology', '51-200', 'IN', 'Asia/Kolkata', 'enterprise', 500, 1)
ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);

-- Step 2: Upsert all users with CORRECT password hash for Admin@123
INSERT INTO `bmi_user` (`id`, `tenant_id`, `email`, `password_hash`, `full_name`, `role`, `is_blocked`, `must_change_password`)
VALUES
  ('bmi0-0000-0000-0000-000000000002', 'bmi0-0000-0000-0000-000000000001', 'admin@bookmyinterview.in',     '$2b$10$0LRa8extmD5tmn9vm57GEeQQyxpELzAn4n3wqfx.95shw9gTbSRV2', 'Super Admin', 'super_admin', 0, 0),
  ('bmi0-0000-0000-0000-000000000003', 'bmi0-0000-0000-0000-000000000001', 'hr@bookmyinterview.in',         '$2b$10$0LRa8extmD5tmn9vm57GEeQQyxpELzAn4n3wqfx.95shw9gTbSRV2', 'Priya Sharma', 'hr_manager', 0, 0),
  ('bmi0-0000-0000-0000-000000000004', 'bmi0-0000-0000-0000-000000000001', 'recruiter@bookmyinterview.in',  '$2b$10$0LRa8extmD5tmn9vm57GEeQQyxpELzAn4n3wqfx.95shw9gTbSRV2', 'Rahul Mehta',  'recruiter',   0, 0)
ON DUPLICATE KEY UPDATE
  `password_hash`       = VALUES(`password_hash`),
  `must_change_password` = 0,
  `is_blocked`          = 0;

-- Step 3: Verify
SELECT `email`, `role`, `is_blocked`, `must_change_password`,
       CASE WHEN `password_hash` LIKE '$2b$%' THEN 'bcrypt OK' ELSE 'WRONG HASH' END AS hash_status
FROM `bmi_user`
WHERE `tenant_id` = 'bmi0-0000-0000-0000-000000000001';
