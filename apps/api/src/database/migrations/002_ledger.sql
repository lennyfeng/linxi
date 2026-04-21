-- 002_ledger.sql: Accounts, Categories, Transactions, Imports, Exchange Rates

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('bank','cash','alipay','wechat','credit_card','other') NOT NULL DEFAULT 'bank',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
  `initial_balance` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(20) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `lemon_account_id` VARCHAR(100) NULL COMMENT 'Linked Lemon Cloud account id',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('income','expense') NOT NULL,
  `parent_id` INT UNSIGNED NULL DEFAULT NULL,
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(20) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `lemon_type_id` VARCHAR(100) NULL COMMENT 'Linked Lemon Cloud type id',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_parent` (`parent_id`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` ENUM('income','expense','transfer','refund') NOT NULL,
  `amount` DECIMAL(18,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
  `exchange_rate` DECIMAL(12,6) NULL,
  `date` DATE NOT NULL,
  `account_id` INT UNSIGNED NOT NULL,
  `to_account_id` INT UNSIGNED NULL COMMENT 'For transfers',
  `category_id` INT UNSIGNED NULL,
  `description` VARCHAR(500) NULL,
  `counterparty` VARCHAR(200) NULL,
  `reference_no` VARCHAR(200) NULL,
  `tags` JSON NULL,
  `is_reconciled` TINYINT(1) NOT NULL DEFAULT 0,
  `import_batch_id` INT UNSIGNED NULL,
  `lemon_journal_id` VARCHAR(100) NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_account` (`account_id`),
  INDEX `idx_category` (`category_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_import_batch` (`import_batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transaction_attachments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` INT UNSIGNED NOT NULL,
  `file_key` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(300) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `import_batches` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_name` VARCHAR(300) NOT NULL,
  `file_key` VARCHAR(500) NULL,
  `total_rows` INT NOT NULL DEFAULT 0,
  `success_rows` INT NOT NULL DEFAULT 0,
  `failed_rows` INT NOT NULL DEFAULT 0,
  `status` ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `created_by` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `import_rows` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` INT UNSIGNED NOT NULL,
  `row_number` INT NOT NULL,
  `raw_data` JSON NOT NULL,
  `status` ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  `error_message` VARCHAR(500) NULL,
  `transaction_id` INT UNSIGNED NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_batch` (`batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_currency` VARCHAR(10) NOT NULL,
  `target_currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
  `rate` DECIMAL(12,6) NOT NULL,
  `rate_date` DATE NOT NULL,
  `source` VARCHAR(50) NOT NULL DEFAULT 'lingxing' COMMENT 'lingxing or manual',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pair_date` (`source_currency`, `target_currency`, `rate_date`),
  INDEX `idx_date` (`rate_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
