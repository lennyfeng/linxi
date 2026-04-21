-- Internal Platform schema v1
-- 本地默认开发库：internal_platform

CREATE DATABASE IF NOT EXISTS internal_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE internal_platform;

-- =========================
-- 1. 用户权限模块
-- =========================

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(64) NULL,
  leader_user_id BIGINT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NULL,
  password_hash VARCHAR(255) NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(128) NULL,
  mobile VARCHAR(32) NULL,
  feishu_user_id VARCHAR(100) NULL,
  source_type VARCHAR(20) NOT NULL DEFAULT 'feishu',
  department_id BIGINT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_feishu_user_id (feishu_user_id),
  KEY idx_users_department_id (department_id),
  CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_key VARCHAR(64) NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_roles_role_key (role_key)
);

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  permission_key VARCHAR(128) NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  permission_type VARCHAR(32) NOT NULL,
  module_key VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_permissions_key (permission_key)
);

CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_roles (user_id, role_id),
  KEY idx_user_roles_user_id (user_id),
  KEY idx_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_permissions (role_id, permission_id),
  KEY idx_role_permissions_role_id (role_id),
  KEY idx_role_permissions_permission_id (permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS login_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  login_type VARCHAR(20) NOT NULL,
  login_result VARCHAR(20) NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  module_key VARCHAR(64) NOT NULL,
  action_key VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NULL,
  target_id VARCHAR(64) NULL,
  content TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. 记账模块
-- =========================

CREATE TABLE IF NOT EXISTS accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(32) NOT NULL,
  account_source_type VARCHAR(32) NULL,
  currency VARCHAR(10) NOT NULL,
  opening_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT NULL,
  category_name VARCHAR(100) NOT NULL,
  category_type VARCHAR(20) NOT NULL,
  sort_no INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_no VARCHAR(64) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  transaction_date DATE NOT NULL,
  posting_date DATE NULL,
  account_id BIGINT NULL,
  transfer_out_account_id BIGINT NULL,
  transfer_in_account_id BIGINT NULL,
  amount DECIMAL(18,2) NOT NULL,
  transfer_in_amount DECIMAL(18,2) NULL,
  currency VARCHAR(10) NOT NULL,
  exchange_rate DECIMAL(18,6) NULL,
  amount_cny DECIMAL(18,2) NULL,
  payment_account VARCHAR(128) NULL,
  category_id BIGINT NULL,
  counterparty_name VARCHAR(128) NULL,
  project_name VARCHAR(128) NULL,
  summary VARCHAR(255) NULL,
  remark VARCHAR(500) NULL,
  reimbursement_required TINYINT(1) NOT NULL DEFAULT 0,
  reimbursement_status VARCHAR(20) NOT NULL DEFAULT 'none',
  invoice_required TINYINT(1) NOT NULL DEFAULT 0,
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_transactions_no (transaction_no),
  KEY idx_transactions_account_id (account_id),
  KEY idx_transactions_category_id (category_id),
  CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS transaction_attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_id BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_transaction_attachments_transaction_id (transaction_id),
  CONSTRAINT fk_transaction_attachments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS reimbursement_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_no VARCHAR(64) NOT NULL,
  applicant_user_id BIGINT NOT NULL,
  feishu_approval_no VARCHAR(128) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_reimbursement_batch_no (batch_no)
);

CREATE TABLE IF NOT EXISTS reimbursement_transaction_relations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reimbursement_batch_id BIGINT NOT NULL,
  transaction_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_reimbursement_transaction (reimbursement_batch_id, transaction_id),
  KEY idx_reimbursement_transaction_batch_id (reimbursement_batch_id),
  KEY idx_reimbursement_transaction_transaction_id (transaction_id),
  CONSTRAINT fk_reimbursement_transaction_batch FOREIGN KEY (reimbursement_batch_id) REFERENCES reimbursement_batches(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_reimbursement_transaction_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS external_import_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_no VARCHAR(64) NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  imported_by BIGINT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_external_import_batch_no (batch_no)
);

CREATE TABLE IF NOT EXISTS external_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  import_batch_id BIGINT NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  external_no VARCHAR(128) NULL,
  transaction_date DATE NULL,
  amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  payment_account VARCHAR(128) NULL,
  counterparty_account VARCHAR(128) NULL,
  counterparty_name VARCHAR(128) NULL,
  bank_summary VARCHAR(255) NULL,
  match_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_external_no_source (source_type, external_no),
  KEY idx_external_transactions_import_batch_id (import_batch_id),
  CONSTRAINT fk_external_transactions_import_batch FOREIGN KEY (import_batch_id) REFERENCES external_import_batches(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS transaction_external_matches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transaction_id BIGINT NOT NULL,
  external_transaction_id BIGINT NOT NULL,
  match_status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  confirmed_by BIGINT NULL,
  confirmed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_match_external_once (external_transaction_id),
  KEY idx_match_transaction_id (transaction_id),
  KEY idx_match_external_transaction_id (external_transaction_id),
  CONSTRAINT fk_transaction_external_matches_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT fk_transaction_external_matches_external FOREIGN KEY (external_transaction_id) REFERENCES external_transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT
);

-- =========================
-- 3. 勾稽模块
-- =========================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(128) NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  invoice_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reminder_disabled TINYINT(1) NOT NULL DEFAULT 0,
  reminder_disabled_reason VARCHAR(255) NULL,
  source_updated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_purchase_order_no (order_no)
);

CREATE TABLE IF NOT EXISTS payment_requests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  request_no VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(128) NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  invoice_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reminder_disabled TINYINT(1) NOT NULL DEFAULT 0,
  reminder_disabled_reason VARCHAR(255) NULL,
  source_updated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_payment_request_no (request_no)
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(128) NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  invoice_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reminder_disabled TINYINT(1) NOT NULL DEFAULT 0,
  reminder_disabled_reason VARCHAR(255) NULL,
  source_updated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_delivery_order_no (order_no)
);

CREATE TABLE IF NOT EXISTS invoice_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_no VARCHAR(64) NOT NULL,
  invoice_type VARCHAR(64) NULL,
  supplier_name VARCHAR(128) NULL,
  amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  invoice_date DATE NULL,
  match_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  source_updated_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_invoice_no (invoice_no)
);

CREATE TABLE IF NOT EXISTS invoice_purchase_relations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT NOT NULL,
  purchase_order_id BIGINT NOT NULL,
  relation_amount DECIMAL(18,2) NOT NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_purchase_relations_invoice_id (invoice_id),
  KEY idx_invoice_purchase_relations_purchase_order_id (purchase_order_id),
  CONSTRAINT fk_invoice_purchase_relations_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_invoice_purchase_relations_purchase FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoice_payment_request_relations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT NOT NULL,
  payment_request_id BIGINT NOT NULL,
  relation_amount DECIMAL(18,2) NOT NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_payment_request_relations_invoice_id (invoice_id),
  KEY idx_invoice_payment_request_relations_payment_id (payment_request_id),
  CONSTRAINT fk_invoice_payment_relations_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_invoice_payment_relations_payment FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoice_delivery_relations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id BIGINT NOT NULL,
  delivery_order_id BIGINT NOT NULL,
  relation_amount DECIMAL(18,2) NOT NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_delivery_relations_invoice_id (invoice_id),
  KEY idx_invoice_delivery_relations_delivery_id (delivery_order_id),
  CONSTRAINT fk_invoice_delivery_relations_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT fk_invoice_delivery_relations_delivery FOREIGN KEY (delivery_order_id) REFERENCES delivery_orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS reconciliation_status_snapshots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  business_type VARCHAR(32) NOT NULL,
  business_id BIGINT NOT NULL,
  amount_total DECIMAL(18,2) NOT NULL DEFAULT 0,
  amount_covered DECIMAL(18,2) NOT NULL DEFAULT 0,
  relation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_business_snapshot (business_type, business_id)
);

-- =========================
-- 4. 新品开发模块
-- =========================

CREATE TABLE IF NOT EXISTS product_dev_projects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_code VARCHAR(64) NOT NULL,
  product_name VARCHAR(128) NOT NULL,
  sku VARCHAR(64) NULL,
  developer_name VARCHAR(100) NULL,
  owner_name VARCHAR(100) NULL,
  target_platform VARCHAR(64) NULL,
  target_market VARCHAR(64) NULL,
  estimated_cost DECIMAL(18,2) NULL,
  target_price DECIMAL(18,2) NULL,
  gross_margin_target DECIMAL(10,4) NULL,
  project_status VARCHAR(32) NOT NULL DEFAULT '待调研',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_dev_project_code (project_code),
  UNIQUE KEY uk_product_dev_sku (sku)
);

CREATE TABLE IF NOT EXISTS supplier_quotes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  supplier_name VARCHAR(128) NOT NULL,
  supplier_erp_id VARCHAR(64) NULL,
  currency VARCHAR(16) NOT NULL DEFAULT 'CNY',
  quote_price DECIMAL(18,2) NOT NULL,
  moq INT NULL,
  tax_included TINYINT(1) NOT NULL DEFAULT 1,
  delivery_days INT NULL,
  preferred_flag TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_supplier_quotes_project_id (project_id),
  CONSTRAINT fk_supplier_quotes_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS profit_calculations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  sales_price_usd DECIMAL(18,2) NOT NULL,
  exchange_rate DECIMAL(18,6) NOT NULL,
  product_cost_rmb DECIMAL(18,2) NOT NULL,
  accessory_cost_rmb DECIMAL(18,2) NOT NULL DEFAULT 0,
  shipping_express DECIMAL(18,2) NULL,
  shipping_air DECIMAL(18,2) NULL,
  shipping_sea DECIMAL(18,2) NULL,
  selected_plan VARCHAR(32) NULL,
  selected_profit DECIMAL(18,2) NULL,
  selected_profit_rate DECIMAL(10,4) NULL,
  calculated_by VARCHAR(100) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_profit_calculations_project_id (project_id),
  CONSTRAINT fk_profit_calculations_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS sample_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  round_no INT NOT NULL,
  supplier_name VARCHAR(128) NULL,
  sample_fee DECIMAL(18,2) NULL,
  review_result VARCHAR(32) NULL,
  improvement_notes VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sample_records_project_id (project_id),
  CONSTRAINT fk_sample_records_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

CREATE TABLE IF NOT EXISTS lingxing_sync_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  sync_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  synced_by VARCHAR(100) NULL,
  sync_time DATETIME NULL,
  result_message VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_lingxing_sync_records_project_id (project_id),
  CONSTRAINT fk_lingxing_sync_records_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
