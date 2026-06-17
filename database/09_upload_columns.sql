-- ================================================================
-- 09_upload_columns.sql
-- Run this after RUN_NEW_TABLES.sql
-- Adds upload-related columns + optional document tracking table
-- ================================================================

USE getjob;

-- Reuse the safe_add_col procedure if it exists
DROP PROCEDURE IF EXISTS safe_add_col;
DELIMITER //
CREATE PROCEDURE safe_add_col(IN p_table VARCHAR(64), IN p_col VARCHAR(64), IN p_def TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_col
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_col, '` ', p_def);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END //
DELIMITER ;

-- bmi_candidate upload columns
CALL safe_add_col('bmi_candidate', 'profile_photo_url',   'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate', 'resume_url',          'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate', 'resume_text',         'LONGTEXT DEFAULT NULL');
CALL safe_add_col('bmi_candidate', 'voice_intro_url',     'VARCHAR(500) DEFAULT NULL');
CALL safe_add_col('bmi_candidate', 'voice_intro_duration','SMALLINT UNSIGNED DEFAULT NULL COMMENT ''seconds''');

-- Optional: document tracking table (for audit trail)
CREATE TABLE IF NOT EXISTS bmi_candidate_document (
    id            VARCHAR(36)  NOT NULL PRIMARY KEY,
    tenant_id     VARCHAR(36)  NOT NULL,
    candidate_id  VARCHAR(36)  NOT NULL,
    document_type ENUM('photo','resume','id_proof','other') NOT NULL DEFAULT 'other',
    file_name     VARCHAR(255) DEFAULT NULL,
    file_url      VARCHAR(500) NOT NULL,
    file_size_kb  INT          DEFAULT NULL,
    mime_type     VARCHAR(100) DEFAULT NULL,
    uploaded_by   VARCHAR(50)  DEFAULT 'candidate',
    uploaded_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    INDEX idx_candidate (candidate_id),
    INDEX idx_type      (candidate_id, document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS safe_add_col;
