-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 10: Background Verification (BGV)
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_bgv_request
-- BGV request initiated for a selected candidate
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_bgv_request` (
  `id`               CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`        CHAR(36)      NOT NULL,
  `application_id`   CHAR(36)      NOT NULL,
  `provider`         ENUM(
                       'digio',
                       'infinity_ai',
                       'authbridge',
                       'hiregenie',
                       'springverify',
                       'manual'
                     ) NOT NULL,
  `provider_ref_id`  VARCHAR(255)  DEFAULT NULL COMMENT 'Reference ID returned by BGV provider API',
  `checks_requested` JSON          DEFAULT NULL COMMENT '["identity","address","employment","education","criminal","court"]',
  `status`           ENUM(
                       'initiated',
                       'in_progress',
                       'completed',
                       'failed',
                       'cancelled'
                     ) NOT NULL DEFAULT 'initiated',
  `result`           ENUM(
                       'clear',
                       'adverse',
                       'pending',
                       'inconclusive'
                     ) DEFAULT 'pending',
  `check_results`    JSON          DEFAULT NULL COMMENT 'Detailed per-check results from provider',
  `report_url`       VARCHAR(500)  DEFAULT NULL,
  `completed_at`     DATETIME      DEFAULT NULL,
  `notes`            TEXT          DEFAULT NULL,
  `initiated_by`     CHAR(36)      NOT NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_status`      (`status`),
  INDEX `idx_result`      (`result`),
  CONSTRAINT `fk_bgv_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_bgv_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Background verification requests for selected candidates';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_bgv_webhook_log
-- Raw webhook events received from BGV providers
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_bgv_webhook_log` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `bgv_request_id` CHAR(36)      DEFAULT NULL,
  `provider`       VARCHAR(50)   NOT NULL,
  `event_type`     VARCHAR(100)  NOT NULL,
  `payload`        JSON          DEFAULT NULL,
  `signature_valid` TINYINT(1)   NOT NULL DEFAULT 0,
  `processed`      TINYINT(1)    NOT NULL DEFAULT 0,
  `error_message`  TEXT          DEFAULT NULL,
  `received_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_bgv_request` (`bgv_request_id`),
  INDEX `idx_processed`   (`processed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Raw webhook events received from BGV providers for audit';

SELECT 'Tables bmi_bgv_request, bmi_bgv_webhook_log created.' AS status;
