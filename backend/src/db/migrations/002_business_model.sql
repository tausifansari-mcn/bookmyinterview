-- Migration 002: Business model — multi-tenant SaaS columns + platform admin table
-- NOTE: ADD COLUMN IF NOT EXISTS is NOT supported in MySQL 8.0 GA.
--       Columns already in bmi_tenant (NOT re-added):
--         id, tenant_code, company_name, company_logo, industry, company_size,
--         country, timezone, plan, plan_expires_at, ai_credits, is_active,
--         created_at, updated_at

ALTER TABLE bmi_tenant
  ADD COLUMN logo_url                    VARCHAR(500)  DEFAULT NULL,
  ADD COLUMN company_tagline             VARCHAR(255)  DEFAULT NULL,
  ADD COLUMN website                     VARCHAR(500)  DEFAULT NULL,
  ADD COLUMN cin_number                  VARCHAR(50)   DEFAULT NULL,
  ADD COLUMN gst_number                  VARCHAR(20)   DEFAULT NULL,
  ADD COLUMN address_line1               VARCHAR(500)  DEFAULT NULL,
  ADD COLUMN city                        VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN state                       VARCHAR(100)  DEFAULT NULL,
  ADD COLUMN pincode                     VARCHAR(10)   DEFAULT NULL,
  ADD COLUMN primary_contact_name        VARCHAR(200)  DEFAULT NULL,
  ADD COLUMN primary_contact_phone       VARCHAR(20)   DEFAULT NULL,
  ADD COLUMN primary_contact_designation VARCHAR(200)  DEFAULT NULL,
  ADD COLUMN onboarding_completed        TINYINT(1)    DEFAULT 0,
  ADD COLUMN onboarding_completed_at     DATETIME      DEFAULT NULL,
  ADD COLUMN subscription_status         ENUM('trial','active','suspended','expired') DEFAULT 'trial',
  ADD COLUMN trial_ends_at               DATETIME      DEFAULT NULL,
  ADD COLUMN max_jobs                    INT           DEFAULT 10,
  ADD COLUMN max_candidates              INT           DEFAULT 500;

-- Super admin table (does not exist yet)
CREATE TABLE IF NOT EXISTS bmi_platform_admin (
  id            CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) DEFAULT NULL,
  is_active     TINYINT(1)   DEFAULT 1,
  last_login_at DATETIME     DEFAULT NULL,
  created_at    DATETIME     DEFAULT NOW(),
  updated_at    DATETIME     DEFAULT NOW() ON UPDATE NOW()
);

-- Seed default super admin (password: Admin@123)
INSERT IGNORE INTO bmi_platform_admin (id, email, password_hash, full_name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin@bookmyinterview.in',
  '$2b$10$01TVJhMUoSAezgZQrd05u.EJh7Q2V4aZomn3VLNSHywcNFFQGyhdC',
  'Super Admin'
);
