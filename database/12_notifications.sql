-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 12: Notifications & Email Templates
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_email_template
-- Customisable email templates per tenant per event
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_email_template` (
  `id`           CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`    CHAR(36)      NOT NULL,
  `event_key`    VARCHAR(100)  NOT NULL COMMENT 'e.g. application_received, interview_invite, offer_sent',
  `name`         VARCHAR(255)  NOT NULL,
  `subject`      VARCHAR(500)  NOT NULL,
  `body_html`    TEXT          NOT NULL COMMENT 'HTML email body with {{variables}}',
  `body_text`    TEXT          DEFAULT NULL COMMENT 'Plain text fallback',
  `variables`    JSON          DEFAULT NULL COMMENT 'List of allowed variable names',
  `is_active`    TINYINT(1)    NOT NULL DEFAULT 1,
  `created_by`   CHAR(36)      DEFAULT NULL,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_event` (`tenant_id`, `event_key`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_emailtpl_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Customisable email templates per tenant per event type';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_notification_log
-- Record of every notification sent (email / SMS / in-app)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_notification_log` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)      NOT NULL,
  `channel`        ENUM('email','sms','whatsapp','in_app','push') NOT NULL,
  `recipient_type` ENUM('user','candidate') NOT NULL,
  `recipient_id`   CHAR(36)      DEFAULT NULL,
  `recipient_email` VARCHAR(320) DEFAULT NULL,
  `recipient_phone` VARCHAR(20)  DEFAULT NULL,
  `event_key`      VARCHAR(100)  DEFAULT NULL,
  `subject`        VARCHAR(500)  DEFAULT NULL,
  `body`           TEXT          DEFAULT NULL,
  `status`         ENUM('queued','sent','delivered','failed','bounced') NOT NULL DEFAULT 'queued',
  `provider_ref`   VARCHAR(255)  DEFAULT NULL COMMENT 'Message ID from email/SMS provider',
  `error_message`  TEXT          DEFAULT NULL,
  `reference_id`   CHAR(36)      DEFAULT NULL COMMENT 'ID of triggering object (application, interview, etc)',
  `reference_type` VARCHAR(50)   DEFAULT NULL,
  `sent_at`        DATETIME      DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tenant_channel`   (`tenant_id`, `channel`),
  INDEX `idx_status`           (`status`),
  INDEX `idx_recipient`        (`recipient_type`, `recipient_id`),
  INDEX `idx_reference`        (`reference_id`),
  CONSTRAINT `fk_notif_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Full log of every notification dispatched across all channels';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_in_app_notification
-- In-app notifications shown in the UI bell icon
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_in_app_notification` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `tenant_id`      CHAR(36)      NOT NULL,
  `user_id`        CHAR(36)      NOT NULL,
  `type`           VARCHAR(50)   NOT NULL COMMENT 'e.g. new_application, interview_reminder, offer_approved',
  `title`          VARCHAR(255)  NOT NULL,
  `message`        TEXT          NOT NULL,
  `action_url`     VARCHAR(500)  DEFAULT NULL,
  `is_read`        TINYINT(1)    NOT NULL DEFAULT 0,
  `read_at`        DATETIME      DEFAULT NULL,
  `reference_id`   CHAR(36)      DEFAULT NULL,
  `reference_type` VARCHAR(50)   DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_unread` (`user_id`, `is_read`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_inapp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='In-app bell-icon notifications for logged-in users';

SELECT 'Tables bmi_email_template, bmi_notification_log, bmi_in_app_notification created.' AS status;
