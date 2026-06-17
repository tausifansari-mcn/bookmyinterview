-- ============================================================
-- BOOK MY INTERVIEW
-- FILE 08: Offers & Offer Letters
-- ============================================================

USE `suggest`;

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_offer
-- Offer letter details for a selected candidate application
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_offer` (
  `id`                     CHAR(36)       NOT NULL DEFAULT (UUID()),
  `tenant_id`              CHAR(36)       NOT NULL,
  `application_id`         CHAR(36)       NOT NULL,
  `offer_number`           VARCHAR(50)    NOT NULL,
  `designation`            VARCHAR(255)   NOT NULL,
  `department_id`          CHAR(36)       DEFAULT NULL,
  `location_id`            CHAR(36)       DEFAULT NULL,
  `joining_date`           DATE           DEFAULT NULL,
  `offer_expiry_date`      DATE           DEFAULT NULL,
  `ctc_annual`             DECIMAL(12,2)  NOT NULL COMMENT 'Total CTC per year in INR',
  `salary_components`      JSON           DEFAULT NULL COMMENT '{"basic":120000,"hra":60000,"special":60000,"pf":17280}',
  `offer_letter_url`       VARCHAR(500)   DEFAULT NULL COMMENT 'URL of generated offer letter PDF',
  `status`                 ENUM(
                             'draft',
                             'pending_approval',
                             'approved',
                             'sent',
                             'accepted',
                             'declined',
                             'revoked',
                             'expired'
                           ) NOT NULL DEFAULT 'draft',
  `approved_by`            CHAR(36)       DEFAULT NULL,
  `approved_at`            DATETIME       DEFAULT NULL,
  `sent_at`                DATETIME       DEFAULT NULL,
  `candidate_response_at`  DATETIME       DEFAULT NULL,
  `decline_reason`         TEXT           DEFAULT NULL,
  `revoke_reason`          TEXT           DEFAULT NULL,
  `created_by`             CHAR(36)       NOT NULL,
  `created_at`             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tenant_offer_number` (`tenant_id`, `offer_number`),
  INDEX `idx_application` (`application_id`),
  INDEX `idx_status`      (`status`),
  INDEX `idx_tenant`      (`tenant_id`),
  CONSTRAINT `fk_offer_tenant` FOREIGN KEY (`tenant_id`)      REFERENCES `bmi_tenant`(`id`)      ON DELETE CASCADE,
  CONSTRAINT `fk_offer_app`    FOREIGN KEY (`application_id`) REFERENCES `bmi_application`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_offer_dept`   FOREIGN KEY (`department_id`)  REFERENCES `bmi_department`(`id`)  ON DELETE SET NULL,
  CONSTRAINT `fk_offer_loc`    FOREIGN KEY (`location_id`)    REFERENCES `bmi_location`(`id`)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Offer letters issued to selected candidates';

-- ────────────────────────────────────────────────────────────
-- TABLE: bmi_offer_approval_log
-- Audit trail of all approval actions on an offer
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `bmi_offer_approval_log` (
  `id`          CHAR(36)      NOT NULL DEFAULT (UUID()),
  `offer_id`    CHAR(36)      NOT NULL,
  `tenant_id`   CHAR(36)      NOT NULL,
  `action`      ENUM('submitted','approved','rejected','revoked','sent','accepted','declined') NOT NULL,
  `action_by`   CHAR(36)      NOT NULL,
  `remarks`     TEXT          DEFAULT NULL,
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_offer`  (`offer_id`),
  CONSTRAINT `fk_offerlog_offer`  FOREIGN KEY (`offer_id`)  REFERENCES `bmi_offer`(`id`)    ON DELETE CASCADE,
  CONSTRAINT `fk_offerlog_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `bmi_tenant`(`id`)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail of all approval actions on an offer letter';

SELECT 'Tables bmi_offer, bmi_offer_approval_log created.' AS status;
