-- Migration 010: Ledger V2 — add project/counterparty FK, account grouping, management tables
-- Date: 2026-04-22

-- ═══════════════════════════════════════
-- 1. transactions: add project_id / counterparty_id
-- ═══════════════════════════════════════
ALTER TABLE transactions ADD COLUMN project_id INT UNSIGNED DEFAULT NULL AFTER project_name;
ALTER TABLE transactions ADD COLUMN counterparty_id INT UNSIGNED DEFAULT NULL AFTER counterparty;

-- FK constraints deferred — historical data may lack matching IDs.
-- Add FK after data migration (backfill project_id from project_name).

-- ═══════════════════════════════════════
-- 2. accounts: add account_group, include_in_assets
-- ═══════════════════════════════════════
ALTER TABLE accounts ADD COLUMN account_group VARCHAR(50) DEFAULT NULL AFTER type;
ALTER TABLE accounts ADD COLUMN include_in_assets TINYINT(1) NOT NULL DEFAULT 1 AFTER is_active;

-- Initialize account_group from existing type
UPDATE accounts SET account_group = CASE type
  WHEN 'cash' THEN '现金账户'
  WHEN 'bank' THEN '储蓄账户'
  WHEN 'alipay' THEN '虚拟账户'
  WHEN 'wechat' THEN '虚拟账户'
  WHEN 'credit_card' THEN '信用卡账户'
  WHEN 'other' THEN '其他账户'
  ELSE '其他账户'
END WHERE account_group IS NULL;

-- ═══════════════════════════════════════
-- 3. ledger_projects: three-level tree
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS ledger_projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  parent_id INT UNSIGNED DEFAULT NULL,
  depth TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=root, 2=child, 3=grandchild',
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent (parent_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════
-- 4. ledger_counterparties: flat list
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS ledger_counterparties (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_name (name),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
