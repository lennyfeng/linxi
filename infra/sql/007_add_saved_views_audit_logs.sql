-- Internal Platform migration 007
-- Add saved_views and audit_logs tables (referenced by code but missing from 002)

USE internal_platform;

-- =========================
-- saved_views
-- =========================

CREATE TABLE IF NOT EXISTS saved_views (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  module_key VARCHAR(64) NOT NULL,
  view_name VARCHAR(100) NOT NULL,
  view_config_json TEXT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_saved_views_user_module (user_id, module_key),
  CONSTRAINT fk_saved_views_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- =========================
-- audit_logs
-- =========================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  log_type VARCHAR(32) NOT NULL,
  module_key VARCHAR(64) NOT NULL,
  object_type VARCHAR(64) NULL,
  object_id BIGINT NULL,
  action VARCHAR(64) NOT NULL,
  operator_id BIGINT NULL,
  operator_name VARCHAR(100) NULL,
  before_snapshot JSON NULL,
  after_snapshot JSON NULL,
  result_status VARCHAR(20) NOT NULL DEFAULT 'success',
  error_message VARCHAR(500) NULL,
  request_id VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_module (module_key),
  KEY idx_audit_logs_operator (operator_id),
  KEY idx_audit_logs_request (request_id)
);
