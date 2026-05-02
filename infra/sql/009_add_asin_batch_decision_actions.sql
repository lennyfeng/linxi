-- Internal Platform migration 009
-- Add ASIN batch-level decision actions for meeting workflow, notifications, and SLA tracking

USE internal_platform;

CREATE TABLE IF NOT EXISTS asin_batch_decision_actions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT NOT NULL,
  action_type VARCHAR(32) NOT NULL,
  conclusion VARCHAR(32) NULL,
  meeting_type VARCHAR(32) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  owner_user_id BIGINT NULL,
  due_at DATETIME NULL,
  notified_at DATETIME NULL,
  notification_channel VARCHAR(32) NULL,
  summary VARCHAR(1000) NULL,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_asin_batch_decision_actions_batch (batch_id),
  KEY idx_asin_batch_decision_actions_type_status (action_type, status),
  KEY idx_asin_batch_decision_actions_due_at (due_at),
  CONSTRAINT fk_asin_batch_decision_actions_batch FOREIGN KEY (batch_id) REFERENCES asin_analysis_batches(id) ON DELETE CASCADE ON UPDATE RESTRICT
);
