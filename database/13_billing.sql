-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 13: Billing, Subscriptions & Invoices
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_subscription
-- Active or historical subscription plan per tenant
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_subscription` (
  `id`                 CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`          CHAR(36)       NOT NULL,
  `plan`               ENUM('starter','growth','enterprise','white_label') NOT NULL,
  `billing_cycle`      ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  `price_monthly`      DECIMAL(10,2)  NOT NULL DEFAULT 0.00 COMMENT 'Effective monthly price in INR',
  `max_users`          INT            NOT NULL DEFAULT 5,
  `max_jobs`           INT            NOT NULL DEFAULT 10,
  `ai_credits_monthly` INT            NOT NULL DEFAULT 100 COMMENT 'Credits added on each billing cycle',
  `custom_domain`      TINYINT(1)     NOT NULL DEFAULT 0,
  `white_label`        TINYINT(1)     NOT NULL DEFAULT 0,
  `status`             ENUM('trial','active','suspended','cancelled','expired') NOT NULL DEFAULT 'trial',
  `trial_ends_at`      DATETIME       DEFAULT NULL,
  `current_period_start` DATETIME     DEFAULT NULL,
  `current_period_end`   DATETIME     DEFAULT NULL,
  `cancelled_at`       DATETIME       DEFAULT NULL,
  `cancel_reason`      TEXT           DEFAULT NULL,
  `payment_gateway`    VARCHAR(50)    DEFAULT NULL COMMENT 'razorpay / stripe / manual',
  `gateway_sub_id`     VARCHAR(255)   DEFAULT NULL COMMENT 'Subscription ID from payment gateway',
  `created_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant`   (`tenant_id`),
  INDEX `idx_status`   (`status`),
  CONSTRAINT `fk_sub_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Subscription plan details per tenant';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_invoice
-- Invoice record per billing period per tenant
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_invoice` (
  `id`              CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`       CHAR(36)       NOT NULL,
  `subscription_id` CHAR(36)       DEFAULT NULL,
  `invoice_number`  VARCHAR(50)    NOT NULL,
  `period_start`    DATE           NOT NULL,
  `period_end`      DATE           NOT NULL,
  `subtotal`        DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `tax_amount`      DECIMAL(12,2)  NOT NULL DEFAULT 0.00 COMMENT '18% GST',
  `total_amount`    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  `currency`        CHAR(3)        NOT NULL DEFAULT 'INR',
  `status`          ENUM('draft','issued','paid','void','overdue') NOT NULL DEFAULT 'draft',
  `paid_at`         DATETIME       DEFAULT NULL,
  `payment_method`  VARCHAR(50)    DEFAULT NULL,
  `gateway_txn_id`  VARCHAR(255)   DEFAULT NULL,
  `invoice_url`     VARCHAR(500)   DEFAULT NULL COMMENT 'URL of PDF invoice',
  `line_items`      JSON           DEFAULT NULL COMMENT '[{"description":"Growth Plan","qty":1,"amount":4999}]',
  `created_at`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  INDEX `idx_tenant`        (`tenant_id`),
  INDEX `idx_status`        (`status`),
  INDEX `idx_period`        (`period_start`, `period_end`),
  CONSTRAINT `fk_invoice_tenant` FOREIGN KEY (`tenant_id`)       REFERENCES `bmi_tenant`(`id`)       ON DELETE CASCADE,
  CONSTRAINT `fk_invoice_sub`    FOREIGN KEY (`subscription_id`) REFERENCES `bmi_subscription`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Monthly/annual invoices per tenant per billing period';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_ai_credit_topup
-- AI credit top-up purchase records (ad-hoc, outside plan)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_ai_credit_topup` (
  `id`             CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)       NOT NULL,
  `credits_added`  INT            NOT NULL,
  `amount_paid`    DECIMAL(10,2)  NOT NULL,
  `gateway_txn_id` VARCHAR(255)   DEFAULT NULL,
  `status`         ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  `created_by`     CHAR(36)       DEFAULT NULL,
  `created_at`     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant` (`tenant_id`),
  CONSTRAINT `fk_topup_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ad-hoc AI credit top-up purchases per tenant';

SELECT 'Tables bmi_subscription, bmi_invoice, bmi_ai_credit_topup created.' AS status;
