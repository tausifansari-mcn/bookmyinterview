-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 14: Audit Log & Hiring Analytics
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_audit_log
-- Immutable event log for every user action in the system
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_audit_log` (
  `id`              CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)      NOT NULL,
  `actor_id`        CHAR(36)      DEFAULT NULL COMMENT 'NULL if system/cron action',
  `actor_email`     VARCHAR(320)  DEFAULT NULL COMMENT 'Snapshot at time of action',
  `actor_role`      VARCHAR(50)   DEFAULT NULL,
  `action`          VARCHAR(100)  NOT NULL COMMENT 'e.g. job.create, candidate.reject, offer.approve',
  `entity_type`     VARCHAR(50)   DEFAULT NULL COMMENT 'e.g. job, candidate, application, offer',
  `entity_id`       CHAR(36)      DEFAULT NULL,
  `old_value`       JSON          DEFAULT NULL COMMENT 'State before change (for updates/deletes)',
  `new_value`       JSON          DEFAULT NULL COMMENT 'State after change (for creates/updates)',
  `ip_address`      VARCHAR(45)   DEFAULT NULL,
  `user_agent`      VARCHAR(500)  DEFAULT NULL,
  `request_id`      VARCHAR(100)  DEFAULT NULL COMMENT 'Correlation ID from HTTP request',
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_date`  (`tenant_id`, `created_at`),
  INDEX `idx_actor`        (`actor_id`),
  INDEX `idx_entity`       (`entity_type`, `entity_id`),
  INDEX `idx_action`       (`action`)
  -- No FK on tenant_id intentionally — audit log must persist even if tenant is soft-deleted
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable audit trail of all user and system actions';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_hiring_metric_daily
-- Pre-aggregated daily hiring funnel metrics per tenant
-- Used to power dashboards without hitting raw tables
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_hiring_metric_daily` (
  `id`                   CHAR(36)  NOT NULL DEFAULT (UUID()),
  `tenant_id`            CHAR(36)  NOT NULL,
  `metric_date`          DATE      NOT NULL,
  `total_open_jobs`      INT       NOT NULL DEFAULT 0,
  `new_applications`     INT       NOT NULL DEFAULT 0,
  `screened_by_ai`       INT       NOT NULL DEFAULT 0,
  `shortlisted`          INT       NOT NULL DEFAULT 0,
  `interviews_scheduled` INT       NOT NULL DEFAULT 0,
  `interviews_done`      INT       NOT NULL DEFAULT 0,
  `offers_issued`        INT       NOT NULL DEFAULT 0,
  `offers_accepted`      INT       NOT NULL DEFAULT 0,
  `offers_declined`      INT       NOT NULL DEFAULT 0,
  `hired`                INT       NOT NULL DEFAULT 0,
  `rejected`             INT       NOT NULL DEFAULT 0,
  `ai_credits_consumed`  INT       NOT NULL DEFAULT 0,
  `avg_ai_match_score`   DECIMAL(5,2) DEFAULT NULL,
  `avg_time_to_offer_days` DECIMAL(6,1) DEFAULT NULL,
  `created_at`           DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_date` (`tenant_id`, `metric_date`),
  INDEX `idx_metric_date` (`metric_date`),
  CONSTRAINT `fk_metric_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pre-aggregated daily hiring KPIs per tenant for dashboard performance';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_source_metric_daily
-- Candidate source performance per day (for sourcing analytics)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_source_metric_daily` (
  `id`             CHAR(36)     NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)     NOT NULL,
  `metric_date`    DATE         NOT NULL,
  `source`         VARCHAR(50)  NOT NULL COMMENT 'naukri/linkedin/indeed/referral/walk_in etc.',
  `applications`   INT          NOT NULL DEFAULT 0,
  `shortlisted`    INT          NOT NULL DEFAULT 0,
  `hired`          INT          NOT NULL DEFAULT 0,
  `cost`           DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Ad spend for paid sources in INR',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_date_source` (`tenant_id`, `metric_date`, `source`),
  CONSTRAINT `fk_srcmetric_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Daily candidate source analytics for cost-per-hire and quality-of-hire reporting';

SELECT 'Tables bmi_audit_log, bmi_hiring_metric_daily, bmi_source_metric_daily created.' AS status;
