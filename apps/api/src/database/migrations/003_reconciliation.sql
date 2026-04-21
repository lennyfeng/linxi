-- 003_reconciliation.sql: Purchase Orders, Payment Requests, Delivery Orders, Suppliers, Invoices, Relations

CREATE TABLE IF NOT EXISTS `lx_suppliers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lx_supplier_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `contact` VARCHAR(200) NULL,
  `phone` VARCHAR(50) NULL,
  `address` VARCHAR(500) NULL,
  `raw_data` JSON NULL,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lx_id` (`lx_supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lx_purchase_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lx_po_id` VARCHAR(100) NOT NULL,
  `po_number` VARCHAR(100) NOT NULL,
  `supplier_id` INT UNSIGNED NULL,
  `status` VARCHAR(50) NULL,
  `total_amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `order_date` DATE NULL,
  `raw_data` JSON NULL,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lx_po` (`lx_po_id`),
  INDEX `idx_supplier` (`supplier_id`),
  INDEX `idx_date` (`order_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lx_po_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `purchase_order_id` INT UNSIGNED NOT NULL,
  `product_name` VARCHAR(300) NULL,
  `sku` VARCHAR(100) NULL,
  `quantity` INT NULL,
  `unit_price` DECIMAL(18,4) NULL,
  `total_price` DECIMAL(18,2) NULL,
  `raw_data` JSON NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_po` (`purchase_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lx_payment_requests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lx_request_id` VARCHAR(100) NOT NULL,
  `request_number` VARCHAR(100) NULL,
  `supplier_id` INT UNSIGNED NULL,
  `amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `status` VARCHAR(50) NULL,
  `request_date` DATE NULL,
  `raw_data` JSON NULL,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lx_req` (`lx_request_id`),
  INDEX `idx_supplier` (`supplier_id`),
  INDEX `idx_date` (`request_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lx_delivery_orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `lx_delivery_id` VARCHAR(100) NOT NULL,
  `delivery_number` VARCHAR(100) NULL,
  `shipment_type` VARCHAR(50) NULL,
  `status` VARCHAR(50) NULL,
  `destination` VARCHAR(200) NULL,
  `ship_date` DATE NULL,
  `raw_data` JSON NULL,
  `synced_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lx_del` (`lx_delivery_id`),
  INDEX `idx_date` (`ship_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lx_invoices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(100) NOT NULL,
  `supplier_id` INT UNSIGNED NULL,
  `amount` DECIMAL(18,2) NULL,
  `currency` VARCHAR(10) NULL DEFAULT 'CNY',
  `invoice_date` DATE NULL,
  `file_key` VARCHAR(500) NULL,
  `status` ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_supplier` (`supplier_id`),
  INDEX `idx_date` (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `recon_relations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_type` ENUM('purchase_order','payment_request','delivery_order','invoice','transaction') NOT NULL,
  `source_id` INT UNSIGNED NOT NULL,
  `target_type` ENUM('purchase_order','payment_request','delivery_order','invoice','transaction') NOT NULL,
  `target_id` INT UNSIGNED NOT NULL,
  `relation_type` ENUM('matched','partial','manual') NOT NULL DEFAULT 'manual',
  `amount` DECIMAL(18,2) NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_source` (`source_type`, `source_id`),
  INDEX `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
