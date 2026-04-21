-- 005_system.sql: Sync Jobs, Notifications, Audit Logs, Settings, Saved Views

CREATE TABLE IF NOT EXISTS `sync_jobs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `job_type` VARCHAR(100) NOT NULL COMMENT 'e.g. sync_purchase_orders, sync_exchange_rates',
  `cron_expression` VARCHAR(50) NULL,
  `interval_seconds` INT NULL,
  `status` ENUM('idle','running','failed','disabled') NOT NULL DEFAULT 'idle',
  `last_run_at` TIMESTAMP NULL,
  `next_run_at` TIMESTAMP NULL,
  `retry_count` INT NOT NULL DEFAULT 0,
  `max_retries` INT NOT NULL DEFAULT 3,
  `config` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_job_type` (`job_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sync_job_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_id` INT UNSIGNED NOT NULL,
  `status` ENUM('success','failed') NOT NULL,
  `started_at` TIMESTAMP NOT NULL,
  `finished_at` TIMESTAMP NULL,
  `duration_ms` INT NULL,
  `records_processed` INT NULL DEFAULT 0,
  `error_message` TEXT NULL,
  `details` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_job` (`job_id`),
  INDEX `idx_started` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `type` VARCHAR(50) NOT NULL COMMENT 'approval, system, sync_error, etc.',
  `title` VARCHAR(200) NOT NULL,
  `content` TEXT NULL,
  `link` VARCHAR(500) NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_read` (`user_id`, `is_read`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` INT UNSIGNED NULL,
  `before_data` JSON NULL,
  `after_data` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_module` (`module`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL,
  `value` JSON NOT NULL,
  `description` VARCHAR(300) NULL,
  `updated_by` INT UNSIGNED NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `saved_views` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `config` JSON NOT NULL COMMENT 'filters, columns, sort, etc.',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_module` (`user_id`, `module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default sync jobs
INSERT IGNORE INTO `sync_jobs` (`name`, `job_type`, `interval_seconds`, `status`) VALUES
  ('Sync Purchase Orders', 'sync_purchase_orders', 3600, 'idle'),
  ('Sync Payment Requests', 'sync_payment_requests', 3600, 'idle'),
  ('Sync Delivery Orders', 'sync_delivery_orders', 3600, 'idle'),
  ('Sync Suppliers', 'sync_suppliers', 86400, 'idle'),
  ('Sync Exchange Rates', 'sync_exchange_rates', 86400, 'idle');
