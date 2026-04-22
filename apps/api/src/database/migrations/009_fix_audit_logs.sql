-- Migration 009: Align audit_logs table to match code expectations
-- The code in common/audit.ts expects different column names than the existing table

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `log_type` VARCHAR(50) NOT NULL DEFAULT 'write',
  `module_key` VARCHAR(50) NOT NULL,
  `object_type` VARCHAR(50) NULL,
  `object_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `operator_id` INT UNSIGNED NULL,
  `operator_name` VARCHAR(100) NULL,
  `before_snapshot` JSON NULL,
  `after_snapshot` JSON NULL,
  `result_status` VARCHAR(50) NOT NULL DEFAULT 'success',
  `error_message` TEXT NULL,
  `request_id` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_module_key` (`module_key`),
  INDEX `idx_operator` (`operator_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
