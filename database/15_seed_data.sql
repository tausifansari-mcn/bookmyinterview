-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 15: Seed Data (Demo Tenant + Admin User)
-- ============================================================
-- Run AFTER all schema files (00–14) have been executed.
-- Admin login: admin@bookmyinterview.in / Admin@123
-- ============================================================

USE `getjob`;

-- ────────────────────────────────────────────────────────────
-- 1. Demo Tenant
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_tenant` (
  `id`,
  `tenant_code`,
  `company_name`,
  `industry`,
  `company_size`,
  `country`,
  `timezone`,
  `plan`,
  `ai_credits`,
  `is_active`
) VALUES (
  'bmi0-0000-0000-0000-000000000001',
  'DEMO',
  'Book My Interview Demo',
  'Technology',
  '51-200',
  'IN',
  'Asia/Kolkata',
  'enterprise',
  500,
  1
) ON DUPLICATE KEY UPDATE `company_name` = VALUES(`company_name`);

-- ────────────────────────────────────────────────────────────
-- 2. Users
-- Password for all demo users: Admin@123
-- Hash: bcrypt cost-12 for "Admin@123"
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_user` (
  `id`, `tenant_id`, `email`, `password_hash`, `full_name`,
  `role`, `is_blocked`, `must_change_password`
) VALUES (
  'bmi0-0000-0000-0000-000000000002',
  'bmi0-0000-0000-0000-000000000001',
  'admin@bookmyinterview.in',
  '$2b$10$0LRa8extmD5tmn9vm57GEeQQyxpELzAn4n3wqfx.95shw9gTbSRV2',
  'Super Admin',
  'super_admin',
  0,
  0
) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

INSERT INTO `bmi_user` (
  `id`, `tenant_id`, `email`, `password_hash`, `full_name`,
  `role`, `is_blocked`, `must_change_password`
) VALUES (
  'bmi0-0000-0000-0000-000000000003',
  'bmi0-0000-0000-0000-000000000001',
  'hr@bookmyinterview.in',
  '$2b$10$0LRa8extmD5tmn9vm57GEeQQyxpELzAn4n3wqfx.95shw9gTbSRV2',
  'Priya Sharma',
  'hr_manager',
  0,
  1
) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

INSERT INTO `bmi_user` (
  `id`, `tenant_id`, `email`, `password_hash`, `full_name`,
  `role`, `is_blocked`, `must_change_password`
) VALUES (
  'bmi0-0000-0000-0000-000000000004',
  'bmi0-0000-0000-0000-000000000001',
  'recruiter@bookmyinterview.in',
  '$2b$10$0LRa8extmD5tmn9vm57GEeQQyxpELzAn4n3wqfx.95shw9gTbSRV2',
  'Rahul Mehta',
  'recruiter',
  0,
  1
) ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- ────────────────────────────────────────────────────────────
-- 3. Departments
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_department` (`id`, `tenant_id`, `name`, `code`, `is_active`) VALUES
  ('bmi0-0000-0000-0001-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Engineering',        'ENG',  1),
  ('bmi0-0000-0000-0001-000000000002', 'bmi0-0000-0000-0000-000000000001', 'Product Management', 'PM',   1),
  ('bmi0-0000-0000-0001-000000000003', 'bmi0-0000-0000-0000-000000000001', 'Sales',              'SALE', 1),
  ('bmi0-0000-0000-0001-000000000004', 'bmi0-0000-0000-0000-000000000001', 'Marketing',          'MKT',  1),
  ('bmi0-0000-0000-0001-000000000005', 'bmi0-0000-0000-0000-000000000001', 'Human Resources',    'HR',   1),
  ('bmi0-0000-0000-0001-000000000006', 'bmi0-0000-0000-0000-000000000001', 'Finance & Accounts', 'FIN',  1),
  ('bmi0-0000-0000-0001-000000000007', 'bmi0-0000-0000-0000-000000000001', 'Operations',         'OPS',  1),
  ('bmi0-0000-0000-0001-000000000008', 'bmi0-0000-0000-0000-000000000001', 'Customer Success',   'CS',   1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ────────────────────────────────────────────────────────────
-- 4. Locations
-- Note: bmi_location has city/state/country — no name column
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_location` (`id`, `tenant_id`, `city`, `state`, `country`, `is_active`) VALUES
  ('bmi0-0000-0000-0002-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Pune',      'Maharashtra', 'IN', 1),
  ('bmi0-0000-0000-0002-000000000002', 'bmi0-0000-0000-0000-000000000001', 'Mumbai',    'Maharashtra', 'IN', 1),
  ('bmi0-0000-0000-0002-000000000003', 'bmi0-0000-0000-0000-000000000001', 'Bangalore', 'Karnataka',   'IN', 1),
  ('bmi0-0000-0000-0002-000000000004', 'bmi0-0000-0000-0000-000000000001', 'Gurugram',  'Haryana',     'IN', 1),
  ('bmi0-0000-0000-0002-000000000005', 'bmi0-0000-0000-0000-000000000001', 'Remote',    NULL,          'IN', 1)
ON DUPLICATE KEY UPDATE `city` = VALUES(`city`);

-- ────────────────────────────────────────────────────────────
-- 5. Pipeline Template
-- created_by is NOT NULL in schema — use admin user ID
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_pipeline_template` (
  `id`, `tenant_id`, `name`, `description`, `is_default`, `created_by`
) VALUES (
  'bmi0-0000-0000-0003-000000000001',
  'bmi0-0000-0000-0000-000000000001',
  'Standard Tech Hiring',
  'Default 6-stage pipeline for technology roles',
  1,
  'bmi0-0000-0000-0000-000000000002'
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ────────────────────────────────────────────────────────────
-- 6. Pipeline Stages
-- Column is pipeline_template_id (not template_id)
-- No is_active column in bmi_pipeline_stage
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_pipeline_stage` (
  `id`, `pipeline_template_id`, `tenant_id`, `stage_name`, `stage_order`, `stage_type`, `sla_hours`
) VALUES
  ('bmi0-0000-0000-0004-000000000001', 'bmi0-0000-0000-0003-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Application Received', 1, 'screening',    24),
  ('bmi0-0000-0000-0004-000000000002', 'bmi0-0000-0000-0003-000000000001', 'bmi0-0000-0000-0000-000000000001', 'AI Shortlisting',      2, 'screening',    12),
  ('bmi0-0000-0000-0004-000000000003', 'bmi0-0000-0000-0003-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Technical Assessment', 3, 'assessment',   72),
  ('bmi0-0000-0000-0004-000000000004', 'bmi0-0000-0000-0003-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Technical Interview',  4, 'interview',    72),
  ('bmi0-0000-0000-0004-000000000005', 'bmi0-0000-0000-0003-000000000001', 'bmi0-0000-0000-0000-000000000001', 'HR Interview',         5, 'interview',    48),
  ('bmi0-0000-0000-0004-000000000006', 'bmi0-0000-0000-0003-000000000001', 'bmi0-0000-0000-0000-000000000001', 'Offer & BGV',          6, 'offer',        96)
ON DUPLICATE KEY UPDATE `stage_name` = VALUES(`stage_name`);

-- ────────────────────────────────────────────────────────────
-- 7. Sample Job
-- Corrected columns: experience_min_years, experience_max_years,
-- pipeline_template_id (not pipeline_id), job_code required
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_job` (
  `id`, `tenant_id`, `job_code`, `title`,
  `department_id`, `location_id`,
  `job_type`, `work_mode`,
  `experience_min_years`, `experience_max_years`,
  `salary_min`, `salary_max`,
  `headcount`, `filled_count`,
  `skills_required`,
  `pipeline_template_id`,
  `status`, `priority`,
  `created_by`
) VALUES (
  'bmi0-0000-0000-0005-000000000001',
  'bmi0-0000-0000-0000-000000000001',
  'JOB-001',
  'Senior Full Stack Developer',
  'bmi0-0000-0000-0001-000000000001',
  'bmi0-0000-0000-0002-000000000003',
  'full_time',
  'hybrid',
  4, 8,
  1200000, 2000000,
  3, 0,
  '["React","Node.js","TypeScript","MySQL","Docker"]',
  'bmi0-0000-0000-0003-000000000001',
  'open',
  'high',
  'bmi0-0000-0000-0000-000000000002'
) ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- ────────────────────────────────────────────────────────────
-- 8. AI Credits ledger entry
-- ────────────────────────────────────────────────────────────
INSERT INTO `bmi_ai_credit_ledger` (
  `id`, `tenant_id`, `action`, `credits_delta`, `balance_after`, `notes`
) VALUES (
  'bmi0-0000-0000-0006-000000000001',
  'bmi0-0000-0000-0000-000000000001',
  'plan_credit',
  500,
  500,
  'Enterprise plan — initial credits on sign-up'
) ON DUPLICATE KEY UPDATE `notes` = VALUES(`notes`);

-- ────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM bmi_tenant)            AS tenants,
  (SELECT COUNT(*) FROM bmi_user)              AS users,
  (SELECT COUNT(*) FROM bmi_department)        AS departments,
  (SELECT COUNT(*) FROM bmi_location)          AS locations,
  (SELECT COUNT(*) FROM bmi_pipeline_template) AS pipelines,
  (SELECT COUNT(*) FROM bmi_pipeline_stage)    AS stages,
  (SELECT COUNT(*) FROM bmi_job)               AS jobs;
