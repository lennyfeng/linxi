-- Internal Platform bootstrap schema draft
-- 当前为骨架阶段，仅创建核心模块占位表

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  feishu_user_id VARCHAR(100) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_no VARCHAR(64) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payment_account VARCHAR(128) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_transactions_no (transaction_no)
);

CREATE TABLE IF NOT EXISTS external_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  import_batch_no VARCHAR(64) NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  external_no VARCHAR(128) NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payment_account VARCHAR(128) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_external_matches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_id BIGINT NOT NULL,
  external_transaction_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_match_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_match_external FOREIGN KEY (external_transaction_id) REFERENCES external_transactions(id),
  UNIQUE KEY uk_match_external_once (external_transaction_id)
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_delivery_order_no (order_no)
);

CREATE TABLE IF NOT EXISTS invoice_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_no VARCHAR(64) NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  invoice_date DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_invoice_no (invoice_no)
);

CREATE TABLE IF NOT EXISTS invoice_delivery_relations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT NOT NULL,
  delivery_order_id BIGINT NOT NULL,
  relation_amount DECIMAL(18,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_relation_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id),
  CONSTRAINT fk_relation_delivery FOREIGN KEY (delivery_order_id) REFERENCES delivery_orders(id)
);
