-- 008_align_code_schema.sql
-- Align database schema to match code expectations
-- Safe to run: test server has no valid data

-- ═══════════════════════════════════════════════════════════
-- 1. Product Dev: product_dev_projects (code expects this, DB has `projects`)
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `product_dev_projects`;
CREATE TABLE `product_dev_projects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_code` VARCHAR(100) NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(100) NULL,
  `developer_name` VARCHAR(100) NULL,
  `owner_name` VARCHAR(100) NULL,
  `target_platform` VARCHAR(100) NULL,
  `target_market` VARCHAR(100) NULL,
  `estimated_cost` DECIMAL(18,2) NULL,
  `target_price` DECIMAL(18,2) NULL,
  `gross_margin_target` DECIMAL(10,2) NULL,
  `project_status` VARCHAR(50) NOT NULL DEFAULT '待调研',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`project_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 2. Product Dev: profit_calculations
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `profit_calculations`;
CREATE TABLE `profit_calculations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `sales_price_usd` DECIMAL(18,2) NULL,
  `exchange_rate` DECIMAL(12,6) NULL,
  `product_cost_rmb` DECIMAL(18,2) NULL,
  `accessory_cost_rmb` DECIMAL(18,2) NULL,
  `shipping_express` DECIMAL(18,2) NULL,
  `shipping_air` DECIMAL(18,2) NULL,
  `shipping_sea` DECIMAL(18,2) NULL,
  `selected_plan` VARCHAR(50) NULL,
  `selected_profit` DECIMAL(18,2) NULL,
  `selected_profit_rate` DECIMAL(10,4) NULL,
  `calculated_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 3. Product Dev: sample_records
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `sample_records`;
CREATE TABLE `sample_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `round_no` INT NOT NULL DEFAULT 1,
  `supplier_name` VARCHAR(200) NULL,
  `sample_fee` DECIMAL(18,2) NULL,
  `review_result` VARCHAR(50) NULL,
  `improvement_notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 4. Product Dev: lingxing_sync_records
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `lingxing_sync_records`;
CREATE TABLE `lingxing_sync_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `sync_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `synced_by` VARCHAR(100) NULL,
  `sync_time` TIMESTAMP NULL,
  `result_message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 5. Product Dev: supplier_quotes (add missing columns)
-- ═══════════════════════════════════════════════════════════
-- Drop and recreate supplier_quotes with correct schema (no valid data)
DROP TABLE IF EXISTS `quote_tiers`;
DROP TABLE IF EXISTS `supplier_quotes`;
CREATE TABLE `supplier_quotes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` INT UNSIGNED NOT NULL,
  `supplier_name` VARCHAR(200) NULL,
  `supplier_erp_id` VARCHAR(100) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `quote_price` DECIMAL(18,4) NULL,
  `moq` INT NULL,
  `tax_included` TINYINT(1) NOT NULL DEFAULT 0,
  `delivery_days` INT NULL,
  `preferred_flag` TINYINT(1) NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `file_key` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 6. Reconciliation: purchase_orders (code-expected view table)
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `purchase_orders`;
CREATE TABLE `purchase_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(100) NOT NULL,
  `supplier_name` VARCHAR(200) NULL,
  `amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `status` VARCHAR(50) NULL,
  `invoice_status` VARCHAR(50) NULL DEFAULT 'pending',
  `reminder_disabled` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_disabled_reason` VARCHAR(500) NULL,
  `source_updated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 7. Reconciliation: payment_requests
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `payment_requests`;
CREATE TABLE `payment_requests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `request_no` VARCHAR(100) NOT NULL,
  `supplier_name` VARCHAR(200) NULL,
  `amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `status` VARCHAR(50) NULL,
  `invoice_status` VARCHAR(50) NULL DEFAULT 'pending',
  `reminder_disabled` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_disabled_reason` VARCHAR(500) NULL,
  `source_updated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_request_no` (`request_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 8. Reconciliation: delivery_orders
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `delivery_orders`;
CREATE TABLE `delivery_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no` VARCHAR(100) NOT NULL,
  `supplier_name` VARCHAR(200) NULL,
  `amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `status` VARCHAR(50) NULL,
  `invoice_status` VARCHAR(50) NULL DEFAULT 'pending',
  `reminder_disabled` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_disabled_reason` VARCHAR(500) NULL,
  `source_updated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_no` (`order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 9. Reconciliation: invoice_records
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `invoice_records`;
CREATE TABLE `invoice_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_no` VARCHAR(100) NOT NULL,
  `invoice_type` VARCHAR(50) NULL,
  `supplier_name` VARCHAR(200) NULL,
  `amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `invoice_date` DATE NULL,
  `match_status` VARCHAR(50) NULL DEFAULT 'unmatched',
  `source_updated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice_no` (`invoice_no`),
  INDEX `idx_date` (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 10. Reconciliation: relation tables
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `invoice_purchase_relations`;
CREATE TABLE `invoice_purchase_relations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` INT UNSIGNED NOT NULL,
  `purchase_order_id` INT UNSIGNED NOT NULL,
  `relation_amount` DECIMAL(18,2) NULL,
  `remark` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice` (`invoice_id`),
  INDEX `idx_po` (`purchase_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_payment_request_relations`;
CREATE TABLE `invoice_payment_request_relations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` INT UNSIGNED NOT NULL,
  `payment_request_id` INT UNSIGNED NOT NULL,
  `relation_amount` DECIMAL(18,2) NULL,
  `remark` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice` (`invoice_id`),
  INDEX `idx_pr` (`payment_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `invoice_delivery_relations`;
CREATE TABLE `invoice_delivery_relations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_id` INT UNSIGNED NOT NULL,
  `delivery_order_id` INT UNSIGNED NOT NULL,
  `relation_amount` DECIMAL(18,2) NULL,
  `remark` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_invoice` (`invoice_id`),
  INDEX `idx_do` (`delivery_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 11. Reconciliation: reconciliation_status_snapshots
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `reconciliation_status_snapshots`;
CREATE TABLE `reconciliation_status_snapshots` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `business_type` VARCHAR(50) NOT NULL,
  `business_id` INT UNSIGNED NOT NULL,
  `amount_total` DECIMAL(18,2) NULL,
  `amount_covered` DECIMAL(18,2) NULL,
  `relation_status` VARCHAR(50) NULL DEFAULT 'none',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_biz` (`business_type`, `business_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════
-- 12. Permissions table (completely missing)
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_key` VARCHAR(200) NOT NULL,
  `permission_name` VARCHAR(200) NULL,
  `permission_type` VARCHAR(50) NULL,
  `module_key` VARCHAR(50) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed some default permissions
INSERT INTO `permissions` (`permission_key`, `permission_name`, `permission_type`, `module_key`) VALUES
('users.list', 'View Users', 'menu', 'users'),
('users.create', 'Create Users', 'action', 'users'),
('users.edit', 'Edit Users', 'action', 'users'),
('users.delete', 'Delete Users', 'action', 'users'),
('ledger.list', 'View Ledger', 'menu', 'ledger'),
('ledger.create', 'Create Transactions', 'action', 'ledger'),
('ledger.edit', 'Edit Transactions', 'action', 'ledger'),
('ledger.delete', 'Delete Transactions', 'action', 'ledger'),
('reconciliation.list', 'View Reconciliation', 'menu', 'reconciliation'),
('reconciliation.manage', 'Manage Relations', 'action', 'reconciliation'),
('product-dev.list', 'View Product Dev', 'menu', 'product-dev'),
('product-dev.create', 'Create Projects', 'action', 'product-dev'),
('product-dev.edit', 'Edit Projects', 'action', 'product-dev'),
('settings.view', 'View Settings', 'menu', 'settings'),
('settings.edit', 'Edit Settings', 'action', 'settings');

-- ═══════════════════════════════════════════════════════════
-- 13. saved_views: fix column names to match code
-- ═══════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `saved_views`;
CREATE TABLE `saved_views` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `module_key` VARCHAR(50) NOT NULL,
  `view_name` VARCHAR(100) NOT NULL,
  `view_config_json` JSON NOT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
