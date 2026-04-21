-- 004_product_dev.sql: Projects, Sampling, Quotes, Profit Calcs, Approvals

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(100) NULL,
  `asin` VARCHAR(20) NULL,
  `stage` ENUM('idea','sourcing','sampling','profit_calc','approval','listing','launched','abandoned') NOT NULL DEFAULT 'idea',
  `priority` ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  `owner_id` INT UNSIGNED NULL,
  `category` VARCHAR(100) NULL,
  `target_market` VARCHAR(100) NULL,
  `target_price` DECIMAL(18,2) NULL,
  `description` TEXT NULL,
  `cover_image` VARCHAR(500) NULL,
  `tags` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_stage` (`stage`),
  INDEX `idx_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sampling_rounds` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `round_number` INT NOT NULL DEFAULT 1,
  `supplier_id` INT UNSIGNED NULL,
  `status` ENUM('pending','received','approved','rejected') NOT NULL DEFAULT 'pending',
  `notes` TEXT NULL,
  `images` JSON NULL,
  `sent_date` DATE NULL,
  `received_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `supplier_quotes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `supplier_id` INT UNSIGNED NULL,
  `supplier_name` VARCHAR(200) NULL,
  `moq` INT NULL,
  `lead_time_days` INT NULL,
  `notes` TEXT NULL,
  `file_key` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quote_tiers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `quote_id` INT UNSIGNED NOT NULL,
  `min_qty` INT NOT NULL,
  `max_qty` INT NULL,
  `unit_price` DECIMAL(18,4) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'CNY',
  PRIMARY KEY (`id`),
  INDEX `idx_quote` (`quote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `profit_calcs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `selling_price_usd` DECIMAL(18,2) NULL,
  `cost_rmb` DECIMAL(18,2) NULL,
  `accessories_rmb` DECIMAL(18,2) NULL,
  `exchange_rate` DECIMAL(12,6) NULL,
  `fba_fee_usd` DECIMAL(18,2) NULL,
  `dimensions_cm` JSON NULL COMMENT '{"l":0,"w":0,"h":0}',
  `volumetric_weight_kg` DECIMAL(10,3) NULL,
  `actual_weight_kg` DECIMAL(10,3) NULL,
  `express_rate` DECIMAL(10,2) NULL,
  `air_rate` DECIMAL(10,2) NULL,
  `sea_rate` DECIMAL(10,2) NULL,
  `express_margin` DECIMAL(10,4) NULL,
  `air_margin` DECIMAL(10,4) NULL,
  `sea_margin` DECIMAL(10,4) NULL,
  `calc_data` JSON NULL COMMENT 'Full calculation breakdown',
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `approvals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'project, transaction, etc.',
  `entity_id` INT UNSIGNED NOT NULL,
  `approval_type` VARCHAR(50) NOT NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `requested_by` INT UNSIGNED NOT NULL,
  `reviewed_by` INT UNSIGNED NULL,
  `comments` TEXT NULL,
  `requested_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_entity` (`entity_type`, `entity_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_reviewer` (`reviewed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `project_stage_history` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `from_stage` VARCHAR(50) NULL,
  `to_stage` VARCHAR(50) NOT NULL,
  `changed_by` INT UNSIGNED NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lingxing_sync_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'product, spu, etc.',
  `entity_id` VARCHAR(100) NOT NULL,
  `action` ENUM('create','update','skip') NOT NULL,
  `details` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
