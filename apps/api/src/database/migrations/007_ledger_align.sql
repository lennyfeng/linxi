-- 007_ledger_align.sql: Align DB schema with application layer requirements
-- Adds missing columns to existing tables and creates missing tables

-- ═══════════════════════════════════════════════════════════════
-- accounts: add columns the application layer needs
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE `accounts`
  ADD COLUMN `account_source_type` VARCHAR(50) NULL DEFAULT 'manual' AFTER `type`,
  ADD COLUMN `bank_name` VARCHAR(100) NULL AFTER `lemon_account_id`,
  ADD COLUMN `account_number` VARCHAR(100) NULL AFTER `bank_name`,
  ADD COLUMN `remark` VARCHAR(500) NULL AFTER `account_number`,
  ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `is_active`;

-- Back-fill status from is_active
UPDATE `accounts` SET `status` = IF(`is_active` = 1, 'active', 'disabled');

-- ═══════════════════════════════════════════════════════════════
-- categories: add status column
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE `categories`
  ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `is_active`;

UPDATE `categories` SET `status` = IF(`is_active` = 1, 'active', 'disabled');

-- ═══════════════════════════════════════════════════════════════
-- transactions: add many missing columns for full feature set
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE `transactions`
  ADD COLUMN `transaction_no` VARCHAR(100) NULL AFTER `id`,
  ADD COLUMN `posting_date` DATE NULL AFTER `date`,
  ADD COLUMN `transfer_in_amount` DECIMAL(18,2) NULL AFTER `amount`,
  ADD COLUMN `amount_cny` DECIMAL(18,2) NULL AFTER `exchange_rate`,
  ADD COLUMN `payment_account` VARCHAR(200) NULL AFTER `counterparty`,
  ADD COLUMN `remark` TEXT NULL AFTER `description`,
  ADD COLUMN `project_name` VARCHAR(200) NULL AFTER `remark`,
  ADD COLUMN `reimbursement_required` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `reimbursement_status` VARCHAR(50) NULL DEFAULT 'none',
  ADD COLUMN `invoice_required` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `status` ENUM('draft','submitted') NOT NULL DEFAULT 'submitted';

-- Add index on status and transaction_no
ALTER TABLE `transactions`
  ADD INDEX `idx_status` (`status`),
  ADD INDEX `idx_transaction_no` (`transaction_no`);

-- ═══════════════════════════════════════════════════════════════
-- transaction_attachments: add file_url for direct URL access
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE `transaction_attachments`
  ADD COLUMN `file_url` VARCHAR(500) NULL AFTER `file_key`;

-- ═══════════════════════════════════════════════════════════════
-- New: external_import_batches (for Airwallex / bank imports)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `external_import_batches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_no` VARCHAR(100) NOT NULL,
  `source_type` VARCHAR(50) NOT NULL DEFAULT 'bank' COMMENT 'bank, airwallex, lemoncloud',
  `file_name` VARCHAR(300) NULL,
  `file_key` VARCHAR(500) NULL,
  `imported_by` INT UNSIGNED NULL,
  `status` ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `total_rows` INT NOT NULL DEFAULT 0,
  `success_rows` INT NOT NULL DEFAULT 0,
  `failed_rows` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_source` (`source_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- New: external_transactions (parsed rows from bank/Airwallex)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `external_transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `import_batch_id` INT UNSIGNED NULL,
  `source_type` VARCHAR(50) NOT NULL DEFAULT 'bank',
  `external_no` VARCHAR(200) NULL COMMENT 'Bank reference / Airwallex txn id',
  `transaction_date` DATE NULL,
  `amount` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
  `payment_account` VARCHAR(200) NULL,
  `counterparty_account` VARCHAR(200) NULL,
  `counterparty_name` VARCHAR(200) NULL,
  `bank_summary` VARCHAR(500) NULL,
  `match_status` ENUM('pending','matched','confirmed','excluded') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_batch` (`import_batch_id`),
  INDEX `idx_match_status` (`match_status`),
  INDEX `idx_date` (`transaction_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════
-- New: transaction_external_matches (links internal ↔ external)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `transaction_external_matches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` INT UNSIGNED NOT NULL,
  `external_transaction_id` INT UNSIGNED NOT NULL,
  `match_status` ENUM('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  `confirmed_by` INT UNSIGNED NULL,
  `confirmed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transaction` (`transaction_id`),
  INDEX `idx_external` (`external_transaction_id`),
  UNIQUE KEY `uk_match` (`transaction_id`, `external_transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
